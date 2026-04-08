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
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "REH Command Center — Ras El Hekma Digital Reporting",
  description: "Enterprise-grade project command center dashboard for the Ras El Hekma development. Real-time KPIs, task management, project health monitoring, and team coordination.",
  keywords: ["Ras El Hekma", "Project Dashboard", "Digital Reporting", "Insite", "KEO", "Command Center"],
};

import { TimeZoneProvider } from "@/context/TimeZoneContext";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <AuthProvider>
          <TimeZoneProvider>
            {children}
          </TimeZoneProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
