import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Tsun On Kwok",
  description: "Tsun On Kwok",
  icons: {
    icon: "/ust.svg",
  },
};

export const viewport: Viewport = {
  width: 1200,
  initialScale: 0.33,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
