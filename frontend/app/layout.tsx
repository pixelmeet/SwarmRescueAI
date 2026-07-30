import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SwarmRescue AI - Multi-Agent Emergency Response",
  description:
    "AI-driven multi-agent disaster triage, dynamic scoring dispatch, and real-time emergency response coordination platform.",
  keywords: [
    "emergency response",
    "rescue coordination",
    "AI triage",
    "disaster management",
    "real-time dispatch",
  ],
  authors: [{ name: "SwarmRescue AI" }],
  openGraph: {
    title: "SwarmRescue AI - Multi-Agent Emergency Response",
    description:
      "Real-time emergency coordination platform with AI-powered triage and dynamic resource dispatch.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-slate-950 text-slate-100 flex flex-col min-h-screen">
        {children}
      </body>
    </html>
  );
}
