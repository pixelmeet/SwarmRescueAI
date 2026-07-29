import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SwarmRescue AI - Multi-Agent Emergency Response",
  description: "AI-driven disaster response and emergency dispatch platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100 flex flex-col min-h-screen">
        {children}
      </body>
    </html>
  );
}
