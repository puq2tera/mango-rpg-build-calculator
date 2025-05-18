import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import StatSync from "./components/StatSync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mango RPG Build Calculator"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <StatSync />
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased pt-10`}>
        <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-800 text-white px-5 py-2 flex space-x-3 text-xs shadow">
          <Link href="/talents" className="hover:underline">
            Talents
          </Link>
          <Link href="/talents/TalentOverview" className="hover:underline">
            Talent Overview
          </Link>
          <Link href="/Skills" className="hover:underline">
            Skills
          </Link>
          <Link href="/Levels" className="hover:underline">
            Levels
          </Link>
          <Link href="/Skills/Buffs" className="hover:underline">
            Buffs
          </Link>
          <Link href="/Skills/BuffSorter" className="hover:underline">
            Buff Overview
          </Link>
          <Link href="/equipment" className="hover:underline">
            Equipment
          </Link>
          <Link href="/equipment/Runewords" className="hover:underline">
            Runewords
          </Link>
          <Link href="/equipment/TarotCards" className="hover:underline">
            Tarot Cards
          </Link>
          <Link href="/CharacterSummary" className="hover:underline">
            Character Summary
          </Link>
          <Link href="/DamageCalc" className="hover:underline">
            Damage
          </Link>
          <Link href="/Healing" className="hover:underline">
            Healing
          </Link>
          <Link href="/WorldBoss" className="hover:underline">
            World Boss
          </Link>
          <Link href="/DebugVars" className="hover:underline">
            Debug
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
