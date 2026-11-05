"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Moon, Sun } from "lucide-react";

export const THEME_KEY = "kaup-theme";
/** Runs before paint so there is no flash of the wrong theme. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})();`;

export function ThemeToggle({ labels = { dark: "Dark mode", light: "Light mode" }, className = "" }: { labels?: { dark: string; light: string }; className?: string }) {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => {
    // Fallback for pages rendered without the head script (e.g. 404s)
    try {
      const t = localStorage.getItem(THEME_KEY);
      const d = t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", d);
    } catch {}
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.add("theme-anim");
    root.classList.toggle("dark", next);
    try { localStorage.setItem(THEME_KEY, next ? "dark" : "light"); } catch {}
    setDark(next);
    setTimeout(() => root.classList.remove("theme-anim"), 500);
  };

  const label = dark ? labels.light : labels.dark;
  return (
    <button onClick={toggle} aria-label={label} title={label} className={`relative grid h-10 w-10 place-items-center overflow-hidden rounded-full hover:bg-cream ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        {dark === null ? <span key="x" className="h-5 w-5" /> : (
          <motion.span key={dark ? "moon" : "sun"} initial={{ y: 18, rotate: -90, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} exit={{ y: -18, rotate: 90, opacity: 0 }} transition={{ duration: 0.25 }}>
            {dark ? <Moon size={19} className="text-lime" /> : <Sun size={19} className="text-volt" />}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
