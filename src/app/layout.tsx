import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "DAKAA | ذكاء",
  description:
    "منصة عربية لتعلم الذكاء الاصطناعي من الصفر، مع دروس تفاعلية وتطبيقات عملية ومساعد تعليمي ذكي.",
  openGraph: {
    title: "DAKAA | ذكاء",
    description:
      "تعلم الذكاء الاصطناعي باللغة العربية من خلال دروس تفاعلية وتطبيقات عملية.",
    url: "https://dakaa-production.up.railway.app",
    siteName: "DAKAA",
    locale: "ar_AR",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}