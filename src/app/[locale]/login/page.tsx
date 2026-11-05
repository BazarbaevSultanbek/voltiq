import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { providerFlags } from "@/auth";
import { currentUserId } from "@/lib/session";
import { getDict } from "@/i18n/dict";
import { isLocale, type Locale } from "@/i18n/config";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function Login({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const { locale } = await params;
  const sp = await searchParams;
  const cb = sp.callbackUrl?.startsWith("/") ? sp.callbackUrl : `/${locale}/account`;
  if (await currentUserId()) redirect(cb);
  const d = await getDict((isLocale(locale) ? locale : "en") as Locale);
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-volt/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-40 bottom-0 h-[400px] w-[400px] rounded-full bg-lime/30 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 lg:grid-cols-2">
        <div className="hidden lg:block">
          <h1 className="font-display text-5xl font-black leading-tight">{d.auth.welcome}</h1>
          <p className="mt-4 max-w-md text-lg text-muted">{d.auth.sub}</p>
        </div>
        <div className="mx-auto w-full max-w-md">
          <h1 className="mb-6 font-display text-3xl font-black lg:hidden">{d.auth.welcome}</h1>
          {sp.error && <p className="mb-4 rounded-2xl bg-berry/10 p-3 text-sm font-bold text-berry">{d.common.error}</p>}
          <AuthForm providers={providerFlags} callbackUrl={cb} />
        </div>
      </div>
    </div>
  );
}
