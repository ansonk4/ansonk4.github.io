import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kai Lin | AI Researcher",
  description: "Personal academic website for Kai Lin, AI researcher."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
