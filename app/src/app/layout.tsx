import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "REH Command Center — Ras El Hekma Digital Reporting",
  description: "Enterprise-grade project command center dashboard for the Ras El Hekma development. Real-time KPIs, task management, project health monitoring, and team coordination.",
  keywords: ["Ras El Hekma", "Project Dashboard", "Digital Reporting", "Insite", "KEO", "Command Center"],
};

import { TimeZoneProvider } from "@/context/TimeZoneContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/shared/EliteToast";
import { ServiceWorkerRegistry } from "@/components/ServiceWorkerRegistry";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <TimeZoneProvider>
            <ToastProvider>
              <ServiceWorkerRegistry />
              {children}
            </ToastProvider>
          </TimeZoneProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
