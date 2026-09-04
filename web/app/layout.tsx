import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">{children}</body>
    </html>
  );
}
