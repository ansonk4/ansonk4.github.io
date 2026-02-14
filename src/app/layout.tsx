import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Tsun On Kwok",
  description: "Tsun On Kwok",
  icons: {
    icon: "/ust.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
