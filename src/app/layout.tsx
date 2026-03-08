import type { Metadata } from "next";
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
