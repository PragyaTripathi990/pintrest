import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/lib/providers";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Pinterest",
  description: "Discover recipes, home ideas, style inspiration and other ideas to try.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-ink">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
