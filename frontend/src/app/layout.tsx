import type { Metadata } from "next";
import { Outfit, Inter, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
});

export const metadata: Metadata = {
  title: "AutoResponse - Intelligent Reputation Care",
  description: "실시간 리뷰 관리 및 AI 맞춤 답글 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${outfit.variable} ${inter.variable} ${dmSerif.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
