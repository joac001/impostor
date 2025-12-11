import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Button } from "@/components/ui/button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Impostor",
  description:
    "Crea salas, juega rondas y descubre al impostor con palabras secretas en tiempo real.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-[#0f1419]">
          <header className="border-b border-slate-800/50 bg-transparent">
            <div className="mx-auto flex max-w-4xl items-center gap-4 px-5 py-3">
              <nav className="flex items-center gap-3">
                <Link href="/como-jugar" passHref>
                  <Button variant="ghost" size="sm">Cómo jugar</Button>
                </Link>
              </nav>
            </div>
          </header>

          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
