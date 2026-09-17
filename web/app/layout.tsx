import type { Metadata } from "next";
import "./globals.css";
import { MobilitySessionProvider } from "./uat/mobility/session-store";

export const metadata: Metadata = {
  title: "India Payroll OS",
  description: "Secure AI-native payroll, tax and compliance workspace.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <MobilitySessionProvider>{children}</MobilitySessionProvider>
        <a
          href="/status"
          aria-label="Open build, accuracy and UAT status"
          style={{
            position: "fixed",
            right: 18,
            bottom: 18,
            zIndex: 50,
            borderRadius: 999,
            padding: "9px 13px",
            background: "#17202a",
            color: "white",
            textDecoration: "none",
            fontSize: 12,
            fontWeight: 700,
            boxShadow: "0 6px 18px rgba(15,23,42,.18)",
          }}
        >
          Build & UAT status
        </a>
      </body>
    </html>
  );
}
