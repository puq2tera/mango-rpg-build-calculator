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
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur border-b border-slate-700 px-5 py-2 flex space-x-3 text-xs shadow-lg shadow-black/30">
          <Link href="/talents" className="text-slate-100 hover:text-sky-300 transition-colors">
            Talents
          </Link>
          <Link href="/talents/TalentOverview" className="text-slate-100 hover:text-sky-300 transition-colors">
            Talent Overview
          </Link>
          <Link href="/Skills" className="text-slate-100 hover:text-sky-300 transition-colors">
            Skills
          </Link>
          <Link href="/Skills/SkillOverview" className="text-slate-100 hover:text-sky-300 transition-colors">
            Skill Overview
          </Link>
          <Link href="/Levels" className="text-slate-100 hover:text-sky-300 transition-colors">
            Levels
          </Link>
          <Link href="/Skills/Buffs" className="text-slate-100 hover:text-sky-300 transition-colors">
            Buffs
          </Link>
          <Link href="/Skills/BuffSorter" className="text-slate-100 hover:text-sky-300 transition-colors">
            Buff Overview
          </Link>
          <Link href="/equipment" className="text-slate-100 hover:text-sky-300 transition-colors">
            Equipment
          </Link>
          <Link href="/equipment/Runewords" className="text-slate-100 hover:text-sky-300 transition-colors">
            Runewords
          </Link>
          <Link href="/equipment/TarotCards" className="text-slate-100 hover:text-sky-300 transition-colors">
            Tarot Cards
          </Link>
          <Link href="/CharacterSummary" className="text-slate-100 hover:text-sky-300 transition-colors">
            Character Summary
          </Link>
          <Link href="/DamageCalc" className="text-slate-100 hover:text-sky-300 transition-colors">
            Damage
          </Link>
          <Link href="/Healing" className="text-slate-100 hover:text-sky-300 transition-colors">
            Healing
          </Link>
          <Link href="/WorldBoss" className="text-slate-100 hover:text-sky-300 transition-colors">
            World Boss
          </Link>
          <Link href="/DebugVars" className="text-slate-100 hover:text-sky-300 transition-colors">
            Debug
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
