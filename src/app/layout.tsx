import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Arnifi Vault",
    template: "%s | Arnifi Vault",
  },
  description: "Secure Document Logbook System — Arnifi",
  keywords: ["vault", "document", "logbook", "arnifi", "secure"],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="bg-arnifi-bg antialiased">
        <SessionProvider session={session}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              classNames: {
                toast:
                  "font-sans text-sm rounded-xl border border-arnifi-border shadow-card-hover",
                success:
                  "border-emerald-200 bg-emerald-50 text-emerald-800",
                error: "border-red-200 bg-red-50 text-red-800",
                info: "border-blue-200 bg-blue-50 text-blue-800",
              },
              duration: 4000,
            }}
            richColors
          />
        </SessionProvider>
      </body>
    </html>
  );
}
