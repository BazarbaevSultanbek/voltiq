"use client";
import { useEffect, useState } from "react";

export function Countdown() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => { const now = new Date(); const end = new Date(now); end.setHours(24, 0, 0, 0); setLeft(end.getTime() - now.getTime()); };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);
  const s = Math.max(0, Math.floor((left ?? 0) / 1000));
  const parts = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0"));
  return (
    <div className="flex items-center gap-1.5 font-display" suppressHydrationWarning>
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-lg font-black tabular-nums text-white">{left === null ? "--" : p}</span>
          {i < 2 && <span className="font-black text-fg">:</span>}
        </span>
      ))}
    </div>
  );
}
