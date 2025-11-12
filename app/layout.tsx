import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "RELIEVA - Sistem Deteksi Penggaraman Relief Candi Borobudur",
  description: "Relief Evaluation System - Sistem deteksi dan analisis penggaraman pada relief Candi Borobudur menggunakan teknologi stitching panorama dan visualisasi 3D WebGL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} antialiased`}
        style={{ fontFamily: 'var(--font-montserrat), system-ui, sans-serif' }}
      >
        {children}
      </body>
    </html>
  );
}
