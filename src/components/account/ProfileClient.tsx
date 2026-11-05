"use client";
import { useRef, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { Camera, Loader2, LogOut, MapPin, Trash2, KeyRound, UserRound } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { useMe } from "@/lib/user-context";
import { countryName } from "@/lib/shipping";
import { Avatar } from "../Header";
import { AccountTabs } from "./AccountTabs";
import { formatDate } from "@/i18n/date";

/** Resize to a 256px square JPEG so avatars stay tiny in the database. */
async function resize(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const s = Math.min(bmp.width, bmp.height);
  const c = document.createElement("canvas"); c.width = c.height = 256;
  c.getContext("2d")!.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, 256, 256);
  return c.toDataURL("image/jpeg", 0.85);
}

export function ProfileClient() {
  const { t, href, locale } = useI18n();
  const { me, refresh } = useMe();
  const fileRef = useRef<HTMLInputElement>(null);
  const [f, setF] = useState<{ name: string; username: string; phone: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  if (!me) return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="animate-spin text-volt" /></div>;
  const form = f ?? { name: me.name || "", username: me.username || "", phone: me.phone || "" };

  const patch = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/me", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error === "username_taken" ? t("profile.usernameTaken") : t("common.error"));
    await refresh();
  };

  const onPhoto = async (file?: File) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) return toast.error(t("profile.tooBig"));
    setPhotoBusy(true);
    try { await patch({ image: await resize(file) }); toast.success(t("profile.saved")); }
    catch (e) { toast.error((e as Error).message); } finally { setPhotoBusy(false); }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await patch(form); setF(null); toast.success(t("profile.saved")); }
    catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) return toast.error(t("profile.mismatch"));
    if (pw.next.length < 8) return toast.error(t("auth.weak"));
    setPwBusy(true);
    const r = await fetch("/api/me/password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ current: pw.current, next: pw.next }) });
    setPwBusy(false);
    if (r.ok) { toast.success(t("profile.passwordChanged")); setPw({ current: "", next: "", confirm: "" }); refresh(); }
    else toast.error(r.status === 403 ? t("auth.badCreds") : t("common.error"));
  };

  const delAddr = async (id: string) => { await fetch(`/api/me/addresses?id=${id}`, { method: "DELETE" }); refresh(); };
  const oauth = me.providers.find((p) => p !== "credentials");

  return (
    <div className="mx-auto max-w-4xl px-4 pb-10 pt-8">
      <AccountTabs />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2rem] bg-night p-6 text-white sm:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-volt/40 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="relative">
            <Avatar src={me.image} name={me.name || me.email} size={104} />
            <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 grid h-10 w-10 place-items-center rounded-full bg-lime text-ink shadow-lg transition hover:scale-110" aria-label={t("profile.changePhoto")}>
              {photoBusy ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-3xl font-black">{me.name || me.email}</h1>
            <p className="text-white/60">{me.username ? `@${me.username} · ` : ""}{me.email}</p>
            <p className="mt-1 text-xs font-semibold text-white/40">{t("profile.memberSince", { date: formatDate(locale, me.createdAt, { month: "long", year: "numeric" }) })}</p>
          </div>
          {me.image && <button onClick={() => patch({ image: "" })} className="text-sm font-bold text-white/60 hover:text-white">{t("profile.removePhoto")}</button>}
        </div>
      </motion.div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <form onSubmit={save} className="rounded-[2rem] bg-surface p-6 ring-1 ring-line md:col-span-2">
          <h2 className="mb-5 flex items-center gap-2 font-display text-lg font-bold"><UserRound size={20} className="text-volt" />{t("nav.profile")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="p-name">{t("profile.name")}</label><input id="p-name" className="input" value={form.name} onChange={(e) => setF({ ...form, name: e.target.value })} /></div>
            <div><label className="label" htmlFor="p-user">{t("profile.username")}</label>
              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted">@</span><input id="p-user" className="input pl-9" pattern="[a-zA-Z0-9_.]{3,24}" value={form.username} onChange={(e) => setF({ ...form, username: e.target.value.toLowerCase() })} /></div></div>
            <div><label className="label" htmlFor="p-email">{t("profile.email")}</label><input id="p-email" className="input bg-cream" value={me.email} disabled /></div>
            <div><label className="label" htmlFor="p-phone">{t("profile.phone")}</label><input id="p-phone" type="tel" className="input" placeholder="+998 90 123 45 67" value={form.phone} onChange={(e) => setF({ ...form, phone: e.target.value })} /></div>
          </div>
          <button className="btn btn-primary mt-6" disabled={saving || !f}>{saving && <Loader2 size={16} className="animate-spin" />}{t("profile.save")}</button>
        </form>

        <form onSubmit={changePw} className="rounded-[2rem] bg-surface p-6 ring-1 ring-line">
          <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold"><KeyRound size={20} className="text-volt" />{t("profile.password")}</h2>
          {!me.hasPassword && <p className="mb-4 text-sm text-muted">{t("profile.noPasswordYet", { provider: oauth ? oauth[0].toUpperCase() + oauth.slice(1) : "Google" })}</p>}
          <div className="space-y-3">
            {me.hasPassword && <div><label className="label" htmlFor="pw-c">{t("profile.currentPassword")}</label><input id="pw-c" type="password" autoComplete="current-password" className="input" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required /></div>}
            <div><label className="label" htmlFor="pw-n">{t("profile.newPassword")}</label><input id="pw-n" type="password" autoComplete="new-password" minLength={8} className="input" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required /></div>
            <div><label className="label" htmlFor="pw-r">{t("profile.confirmPassword")}</label><input id="pw-r" type="password" autoComplete="new-password" minLength={8} className="input" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required /></div>
          </div>
          <button className="btn btn-dark mt-5" disabled={pwBusy}>{pwBusy && <Loader2 size={16} className="animate-spin" />}{me.hasPassword ? t("profile.changePassword") : t("profile.setPassword")}</button>
        </form>

        <div className="flex flex-col gap-6">
          <div className="rounded-[2rem] bg-surface p-6 ring-1 ring-line">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold"><MapPin size={20} className="text-volt" />{t("profile.addresses")}</h2>
            {me.addresses.length === 0 ? <p className="text-sm text-muted">{t("profile.noAddresses")}</p> : (
              <ul className="space-y-2">{me.addresses.map((a) => (
                <li key={a._id} className="flex items-start justify-between gap-3 rounded-2xl bg-cream p-3 text-sm">
                  <span><b>{a.fullName}</b><br /><span className="text-muted">{a.line1}, {a.city}, {countryName(a.country)}</span></span>
                  <button onClick={() => delAddr(a._id)} className="rounded-full p-1.5 text-muted hover:bg-berry/10 hover:text-berry" aria-label={t("profile.delete")}><Trash2 size={16} /></button>
                </li>))}
              </ul>
            )}
          </div>
          <div className="rounded-[2rem] bg-surface p-6 ring-1 ring-line">
            <h2 className="font-display text-lg font-bold">{t("profile.logout")}</h2>
            <p className="mt-1 text-sm text-muted">{t("profile.logoutSub")}</p>
            <button onClick={() => signOut({ callbackUrl: href("/") })} className="btn mt-4 border-[1.5px] border-berry/30 text-berry hover:bg-berry hover:text-white"><LogOut size={16} />{t("profile.logout")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
