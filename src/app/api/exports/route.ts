import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { checkoutRepository } from "@/repositories/checkout.repository";
import { auditRepository } from "@/repositories/audit.repository";
import { formatDateTime, formatDate } from "@/lib/utils/format";
import {
  VAULT_LOCATIONS,
  type VaultLocationKey,
  getLockerLabel,
  getRackLabel,
} from "@/lib/config/vault-locations";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const XLSX = require("xlsx");

// Friendly "Dubai · Locker 1 · Last Rack" from a checkout log's stored snapshot
// (location/lockerNo/rackNo hold the raw values captured at checkout time).
function formatLocation(
  location: string | null,
  lockerNo: string | null,
  rackNo: string | null
): string {
  if (!location) return "—";
  const name = VAULT_LOCATIONS[location as VaultLocationKey]?.label ?? location;
  const parts: string[] = [name];
  if (lockerNo) parts.push(getLockerLabel(location, lockerNo));
  if (rackNo) parts.push(getRackLabel(location, lockerNo, rackNo));
  return parts.join(" · ");
}

// Export the checkout history (admin only). Honours the same filters as the
// Checkout History screen. Never leaks data the caller's role shouldn't see —
// only ADMIN reaches this, and there is no role-scoped checkout data.
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") ?? "csv";
    const search = searchParams.get("search") ?? undefined;
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;
    const companyId = searchParams.get("companyId") ?? undefined;
    const clientId = searchParams.get("clientId") ?? undefined;

    // Pull all matching rows (with resolved performer names) for the export.
    const { data: logs } = await checkoutRepository.findAll({
      search,
      dateFrom,
      dateTo,
      companyId,
      clientId,
      page: 1,
      limit: 100000,
    });

    const rows = logs.map((log, i) => ({
      "#": i + 1,
      "Document Code": log.docCode,
      "Document Name": log.docName,
      Owner: log.ownerClient ?? log.ownerCompany ?? "—",
      Location: formatLocation(log.location, log.lockerNo, log.rackNo),
      "Taken By": log.takenByName,
      "Contact / Dept": log.takenByDetail ?? "—",
      Purpose: log.purpose ?? "—",
      "Checked Out At": formatDateTime(log.checkedOutAt),
      "Issued By": log.performerName ?? "—",
    }));

    if (rows.length === 0) {
      return NextResponse.json({
        empty: true,
        message:
          search || dateFrom || dateTo || companyId || clientId
            ? "No checkouts match the selected filters."
            : "No checkouts to export yet. Check out a document first.",
      });
    }

    await auditRepository.create({
      action: "REPORT_EXPORTED",
      entityType: "System",
      entityId: "checkout-history",
      actorId: session.user.id,
      metadata: { format, filters: { search, dateFrom, dateTo, companyId, clientId }, rowCount: rows.length },
    });

    const fileName = `vault-checkout-history-${formatDate(new Date())}`;

    // ── CSV ──────────────────────────────────────────────────
    if (format === "csv") {
      const headers = Object.keys(rows[0]);
      const csvRows = [
        headers.join(","),
        ...rows.map((row) =>
          headers
            .map((h) => `"${String(row[h as keyof typeof row] ?? "").replace(/"/g, '""')}"`)
            .join(",")
        ),
      ];
      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${fileName}.csv"`,
        },
      });
    }

    // ── Excel ────────────────────────────────────────────────
    if (format === "excel") {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: 0, c: C });
        if (ws[addr]) ws[addr].s = { font: { bold: true }, fill: { fgColor: { rgb: "4F46E5" } } };
      }
      ws["!cols"] = Object.keys(rows[0]).map(() => ({ wch: 20 }));
      XLSX.utils.book_append_sheet(wb, ws, "Checkout History");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${fileName}.xlsx"`,
        },
      });
    }

    // ── PDF ──────────────────────────────────────────────────
    if (format === "pdf") {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, 297, 20, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Arnifi Vault — Checkout History", 14, 13);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${formatDateTime(new Date())}`, 215, 13);

      autoTable(doc, {
        startY: 25,
        head: [["Code", "Document", "Owner", "Taken By", "Purpose", "Checked Out", "Issued By"]],
        body: rows.map((r) => [
          r["Document Code"],
          r["Document Name"],
          r.Owner,
          r["Taken By"],
          r.Purpose,
          r["Checked Out At"],
          r["Issued By"],
        ]),
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { top: 25, left: 10, right: 10 },
      });

      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fileName}.pdf"`,
        },
      });
    }

    return new NextResponse("Invalid format. Use csv, excel, or pdf.", { status: 400 });
  } catch (error) {
    console.error("Export error:", error);
    return new NextResponse("Export failed", { status: 500 });
  }
}
