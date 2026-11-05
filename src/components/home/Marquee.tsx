"use client";
import Link from "next/link";
import { useI18n } from "@/i18n/client";
import { CATEGORIES } from "@/lib/catalog";

export function Marquee() {
  const { t, href } = useI18n();
  const row = [...CATEGORIES, ...CATEGORIES];
  return (
    <div className="relative -mt-6 rotate-[-1.2deg] overflow-hidden border-y-2 border-fg bg-lime py-3.5">
      <div className="flex w-max animate-marquee gap-10 hover:[animation-play-state:paused]">
        {row.map((c, i) => (
          <Link key={i} href={href(`/search?cat=${c.slug}`)} className="flex items-center gap-3 font-display text-lg font-black uppercase text-ink">
            {t(`cat.${c.slug}`)} <span className="text-volt">✦</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
