"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { Send, Check } from "lucide-react";
import { useI18n } from "@/i18n/client";

export function Newsletter() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState(false);
  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-volt p-8 text-white sm:p-14">
        <motion.div aria-hidden className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-lime/50 blur-3xl" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 8, repeat: Infinity }} />
        <img src="/products/headphones-black.svg" alt="" className="absolute -bottom-10 right-6 hidden w-72 rotate-6 rounded-[2rem] shadow-2xl lg:block" />
        <div className="relative max-w-xl">
          <h2 className="font-display text-3xl font-black sm:text-5xl">{t("home.newsletterT")}</h2>
          <p className="mt-3 text-white/85">{t("home.newsletterD")}</p>
          {ok ? (
            <p className="mt-8 flex items-center gap-2 text-lg font-bold"><Check className="rounded-full bg-white p-1 text-volt" />{t("home.newsletterOk")}</p>
          ) : (
            <form className="mt-8 flex max-w-md gap-2 rounded-full bg-white p-1.5" onSubmit={async (e) => { e.preventDefault(); const r = await fetch("/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) }); if (r.ok) setOk(true); }}>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("home.emailPlaceholder")} aria-label="Email" className="min-w-0 flex-1 bg-transparent px-4 font-semibold text-ink outline-none" />
              <button className="btn btn-dark py-3">{t("home.newsletterBtn")} <Send size={16} /></button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
