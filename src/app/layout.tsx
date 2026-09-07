import type { Metadata } from "next";
import { Cinzel, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700", "900"],
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "WoW PvP Feed",
  description:
    "Cached World of Warcraft PvP news from Wowhead, MMO-Champion, and Icy Veins.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${cinzel.variable} ${sourceSans.variable} antialiased`}>{children}</body>
    </html>
  );
}
