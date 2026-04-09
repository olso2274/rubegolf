import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "2026 Masters Pool Live Leaderboard",
  description:
    "Live-updating Masters fantasy pool leaderboard — six teams, forty-eight players, Augusta National.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${playfair.variable} min-h-screen font-sans antialiased`}
        suppressHydrationWarning
      >
        <div className="masters-bg min-h-screen">
          <header className="border-b border-masters-green/20 bg-gradient-to-r from-masters-green via-emerald-900 to-masters-green shadow-md">
            <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-6 sm:px-6">
              <p className="font-display text-3xl font-bold tracking-tight text-amber-400 sm:text-4xl">
                2026 Masters Pool
              </p>
              <p className="text-sm font-medium text-emerald-100/90">
                Augusta National · April 9–12, 2026
              </p>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
