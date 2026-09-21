import type { Metadata } from "next";
import { Geist, Geist_Mono, Marck_Script } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const marckScript = Marck_Script({
  variable: "--font-script",
  weight: "400",
  subsets: ["cyrillic", "latin"],
});

export const metadata: Metadata = {
  title: "ProManas — ОРТ Тестирование",
  description: "Платформа для проведения тестирования по ОРТ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} ${marckScript.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-slate-900">
        {children}
      </body>
    </html>
  );
}
