import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getViewUrl } from "@/lib/s3";
import { documentRepository } from "@/repositories/document.repository";
import { documentScopeForUser } from "@/lib/db/scopes";

// Streams a stored document scan to the browser via a short-lived presigned
// GET URL. The S3 bucket is private, so the public object URL returns
// AccessDenied — every "View" link must come through here instead.
//
//   GET /api/files/view?id=<documentId>   → scoped to what the user may see
//   GET /api/files/view?key=<fileKey>     → admin only (fresh uploads, no id yet)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const key = searchParams.get("key");

  let fileKey: string | null = null;

  if (id) {
    // Resolve via the document so access control matches what the user can list.
    const scope = documentScopeForUser(session.user);
    const doc = await documentRepository.findByIdScoped(id, scope);
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    fileKey = doc.fileKey;
  } else if (key) {
    // Direct key access is only for admins viewing a file they just uploaded
    // (before a document record exists). Restricted to the uploads prefix.
    if (session.user.role !== "ADMIN" || !key.startsWith("documents/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    fileKey = key;
  } else {
    return NextResponse.json(
      { error: "Provide an 'id' or 'key' query parameter" },
      { status: 400 }
    );
  }

  if (!fileKey) {
    return NextResponse.json({ error: "No file attached" }, { status: 404 });
  }

  try {
    const url = await getViewUrl(fileKey);
    return NextResponse.redirect(url, 302);
  } catch (error) {
    console.error("File view URL generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate file URL" },
      { status: 500 }
    );
  }
}
