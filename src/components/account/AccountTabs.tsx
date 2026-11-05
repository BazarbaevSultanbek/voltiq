"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useI18n } from "@/i18n/client";

export function AccountTabs() {
  const { t, href } = useI18n();
  const path = usePathname();
  const tabs = [["/account", t("nav.profile")], ["/account/orders", t("nav.orders")]];
  return (
    <div className="mb-8 inline-flex rounded-full bg-cream p-1">
      {tabs.map(([h, l]) => {
        const on = path === href(h);
        return (
          <Link key={h} href={href(h)} className="relative rounded-full px-5 py-2 text-sm font-bold">
            {on && <motion.span layoutId="acct-tab" className="absolute inset-0 rounded-full bg-ink" />}
            <span className={`relative ${on ? "text-white" : ""}`}>{l}</span>
          </Link>
        );
      })}
    </div>
  );
}
