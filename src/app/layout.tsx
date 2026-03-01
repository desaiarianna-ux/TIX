import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TIX MVP",
  description: "NY ticket/summons quick validity checker"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
