"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { signIn } from "next-auth/react";
import { Loader2, Mail } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { useMe } from "@/lib/user-context";

export function AuthForm({ providers, callbackUrl }: { providers: { google: boolean; apple: boolean }; callbackUrl: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const { refresh } = useMe();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (mode === "up" && f.password.length < 8) return setErr(t("auth.weak"));
    setBusy("email");
    try {
      if (mode === "up") {
        const r = await fetch("/api/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
        if (!r.ok) { const d = await r.json(); setErr(d.error === "exists" ? t("auth.exists") : t("common.error")); return; }
      }
      const res = await signIn("credentials", { email: f.email, password: f.password, redirect: false });
      if (!res || res.error) { setErr(t("auth.badCreds")); return; }
      await refresh();
      router.push(callbackUrl);
      router.refresh();
    } finally { setBusy(null); }
  };

  return (
    <div className="rounded-[2rem] bg-white p-6 ring-1 ring-line sm:p-8">
      <div className="space-y-3">
        {providers.google && (
          <button onClick={() => { setBusy("google"); signIn("google", { callbackUrl }); }} className="btn btn-ghost w-full bg-white py-3.5">
            {busy === "google" ? <Loader2 className="animate-spin" size={18} /> : <svg viewBox="0 0 48 48" className="h-5 w-5"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>}
            {t("auth.google")}
          </button>
        )}
        {providers.apple && (
          <button onClick={() => { setBusy("apple"); signIn("apple", { callbackUrl }); }} className="btn btn-dark w-full py-3.5">
            {busy === "apple" ? <Loader2 className="animate-spin" size={18} /> : <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M16.37 12.6c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.76 2.28-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.66zM14.1 5.86c.63-.77 1.06-1.83.94-2.9-.91.04-2.02.61-2.67 1.37-.58.67-1.1 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.27z"/></svg>}
            {t("auth.apple")}
          </button>
        )}
      </div>
      {(providers.google || providers.apple) && <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-muted"><span className="h-px flex-1 bg-line" />{t("auth.or")}<span className="h-px flex-1 bg-line" /></div>}
      <form onSubmit={submit} className="space-y-4">
        <AnimatePresence initial={false}>
          {mode === "up" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <label className="label" htmlFor="au-name">{t("auth.name")}</label>
              <input id="au-name" className="input" autoComplete="name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            </motion.div>
          )}
        </AnimatePresence>
        <div><label className="label" htmlFor="au-email">{t("auth.email")}</label><input id="au-email" type="email" autoComplete="email" required className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div><label className="label" htmlFor="au-pw">{t("auth.password")}</label><input id="au-pw" type="password" autoComplete={mode === "up" ? "new-password" : "current-password"} required minLength={mode === "up" ? 8 : 6} className="input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        {err && <p className="text-sm font-bold text-berry">{err}</p>}
        <button className="btn btn-primary w-full py-3.5" disabled={!!busy}>{busy === "email" ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />}{mode === "in" ? t("auth.signIn") : t("auth.signUp")}</button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        {mode === "in" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
        <button onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(""); }} className="font-bold text-volt">{mode === "in" ? t("auth.switchUp") : t("auth.switchIn")}</button>
      </p>
    </div>
  );
}
