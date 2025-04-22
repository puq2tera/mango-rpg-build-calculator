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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <nav className="bg-gray-800 text-white px-5 flex space-x-3 text-xs ">
          <Link href="/talents" className="hover:underline">
            Talents
          </Link>
          <Link href="/skills" className="hover:underline">
            Skills
          </Link>
          <Link href="/equipment" className="hover:underline">
            Equipment
          </Link>
          <Link href="/damage" className="hover:underline">
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
