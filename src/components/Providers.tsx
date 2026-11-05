"use client";
import { Toaster } from "sonner";
import { I18nProvider } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import type { Dict } from "@/i18n/dict";
import { UserProvider } from "@/lib/user-context";
import { LocationGate } from "./LocationGate";

export function Providers({ locale, dict, children }: { locale: Locale; dict: Dict; children: React.ReactNode }) {
  return (
    <I18nProvider locale={locale} dict={dict}>
      <UserProvider>
        {children}
        <LocationGate />
        <Toaster position="top-center" richColors toastOptions={{ style: { borderRadius: 16, fontFamily: "var(--font-sans)", fontWeight: 600 } }} />
      </UserProvider>
    </I18nProvider>
  );
}
