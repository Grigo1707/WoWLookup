import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "WoWLookup – WoW Charakter prüfen",
  description:
    "Auf einen Blick Ausrüstung, Talente und Performance von World of Warcraft Charakteren prüfen.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">
        {children}
        <Script id="wowhead-config" strategy="beforeInteractive">{`
          const whTooltips = { colorLinks: true, iconSize: 'medium', rename: true };
        `}</Script>
        <Script src="https://wow.zamimg.com/widgets/power.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
