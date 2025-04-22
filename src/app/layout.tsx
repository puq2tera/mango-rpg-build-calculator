import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased pt-10`}>
        <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-800 text-white px-5 py-2 flex space-x-3 text-xs shadow">
          <Link href="/talents" className="hover:underline">
            Talents
          </Link>
          <Link href="/talents/TalentOverview" className="hover:underline">
            Talent Overview
          </Link>
          <Link href="/skills" className="hover:underline">
            Skills
          </Link>
          <Link href="/equipment" className="hover:underline">
            Equipment
          </Link>
          <Link href="/CharacterSummary" className="hover:underline">
            Character Summary
          </Link>
          <Link href="/damage" className="hover:underline">
            Damage
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
