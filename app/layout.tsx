import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/components/providers";
import { MainNav } from "@/components/main-nav";

export const metadata: Metadata = {
  title: "LumaWell",
  description:
    "Daily fitness, meal, and micro-habit plans for busy moms. Built with Next.js and Supabase."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="app-shell">
            <MainNav />
            <main className="app-main">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
