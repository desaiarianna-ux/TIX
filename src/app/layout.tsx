import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tix — Ticket Validity & Defense Builder",
  description: "Check ticket validity, estimate pay vs fight likelihood, and draft an appeal."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
