import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const themeScript = `
(function () {
  try {
    var stored = window.localStorage.getItem("theme");
    var theme = stored === "dark" || stored === "light" ? stored : "light";
    document.documentElement.dataset.theme = theme;
  } catch (error) {
    document.documentElement.dataset.theme = "light";
  }
})();
`;

export const metadata: Metadata = {
  title: "Anson Tsun On Kwok",
  description: "Personal academic website for Anson Tsun On Kwok, AI researcher."
};

const cloudflareWebAnalyticsToken =
  process.env.NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN;

const cloudflareWebAnalyticsConfig = cloudflareWebAnalyticsToken
  ? JSON.stringify({ token: cloudflareWebAnalyticsToken })
  : null;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/et-book/et-book-roman-line-figures.woff"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
        <link rel="icon" href="/assets/ust.svg" type="image/svg+xml" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        {cloudflareWebAnalyticsConfig ? (
          <Script
            id="cloudflare-web-analytics"
            src="https://static.cloudflareinsights.com/beacon.min.js"
            strategy="afterInteractive"
            data-cf-beacon={cloudflareWebAnalyticsConfig}
          />
        ) : null}
      </body>
    </html>
  );
}
