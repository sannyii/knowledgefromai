import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";
import { ProcessingProvider } from "@/lib/processing-context";
import { AIConfigProvider } from "@/lib/ai-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KnowledgeVault - Turn Chaos into Knowledge",
  description: "Extract knowledge from long articles, notes, or documents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <I18nProvider>
          <AIConfigProvider>
            <ProcessingProvider>
              {children}
            </ProcessingProvider>
          </AIConfigProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
