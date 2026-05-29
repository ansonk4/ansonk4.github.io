import type { Metadata } from "next";
import "./globals.css";

const themeScript = `
(function () {
  try {
    var stored = window.localStorage.getItem("theme");
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = stored === "dark" || stored === "light" ? stored : prefersDark ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
  } catch (error) {
    document.documentElement.dataset.theme = "light";
  }
})();
`;

export const metadata: Metadata = {
  title: "Kwok Tsun On",
  description: "Personal academic website for Kai Lin, AI researcher."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/assets/ust.svg" type="image/svg+xml" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
