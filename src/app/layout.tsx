import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { DashboardProvider } from "@/components/DashboardProvider";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VJ Tech CRM Intelligence",
  description: "Deterministic Executive Operations Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F8FAFC] text-slate-900 overflow-hidden h-screen flex`}>
        <DashboardProvider>
          {/* Fixed Left Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto w-full flex flex-col">
            {children}
          </main>
        </DashboardProvider>
      </body>
    </html>
  );
}
