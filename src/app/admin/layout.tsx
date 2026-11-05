import type { Metadata } from "next";
import "../globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = { title: "VOLTIQ Admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
