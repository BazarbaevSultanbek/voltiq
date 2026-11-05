"use client";
import { motion } from "motion/react";
import type { Brand } from "@/lib/cards";

const BG: Record<string, string> = {
  visa: "from-[#1a1f71] via-[#2b3aa8] to-[#0d1240]",
  mastercard: "from-[#1f1f24] via-[#3a2a22] to-[#e04600]",
  unionpay: "from-[#00447c] via-[#007b84] to-[#e21836]",
  unknown: "from-ink via-ink-3 to-ink-2",
};

export function CardPreview({ number, name, exp, brand, flipped }: { number: string; name: string; exp: string; brand: Brand; flipped: boolean }) {
  const digits = number.replace(/\D/g, "");
  const masked = (digits + "•".repeat(Math.max(0, 16 - digits.length))).slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const bg = BG[brand] || BG.unknown;
  return (
    <div className="mx-auto w-full max-w-[340px] [perspective:1200px]">
      <motion.div className="relative aspect-[1.586] w-full [transform-style:preserve-3d]" animate={{ rotateY: flipped ? 180 : 0 }} transition={{ type: "spring", stiffness: 120, damping: 16 }}>
        <div className={`absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br ${bg} p-5 text-white shadow-2xl [backface-visibility:hidden] transition-colors duration-500`}>
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-white/5" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="h-8 w-11 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500 opacity-90" />
              <span className="font-display text-sm font-black uppercase italic tracking-wider">{brand === "unknown" ? "" : brand === "unionpay" ? "UnionPay" : brand}</span>
            </div>
            <p className="font-mono text-[clamp(1rem,4.6vw,1.3rem)] tracking-[0.12em]">{masked}</p>
            <div className="flex items-end justify-between text-xs">
              <div className="min-w-0"><p className="text-[9px] uppercase text-white/50">Card holder</p><p className="truncate font-bold uppercase">{name || "YOUR NAME"}</p></div>
              <div className="text-right"><p className="text-[9px] uppercase text-white/50">Expires</p><p className="font-bold">{exp || "MM/YY"}</p></div>
            </div>
          </div>
        </div>
        <div className={`absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br ${bg} text-white shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]`}>
          <div className="mt-6 h-10 bg-black/70" />
          <div className="mx-5 mt-5 flex items-center justify-end rounded bg-white/90 px-3 py-2 font-mono text-sm font-bold italic text-ink">CVC •••</div>
        </div>
      </motion.div>
    </div>
  );
}
