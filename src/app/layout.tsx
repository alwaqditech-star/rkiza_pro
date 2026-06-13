import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";
import "./design-enhancements.css";

const ibmArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  title: "ركاز — نظام المحاسبة للقطاع غير الربحي",
  description: "نظام المحاسبة للقطاع غير الربحي",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${ibmArabic.variable} h-full`}>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font)" }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
