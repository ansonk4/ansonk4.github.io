import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Zoe — Full-stack Developer",
  description:
    "Portfolio of Zoe, a full-stack developer passionate about interactive frontend development.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
