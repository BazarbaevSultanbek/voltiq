export function Logo({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-volt shadow-[0_8px_20px_-6px_rgb(255_91_20/.8)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6.2L13.5 2Z" fill="#c8f43c" stroke="#0d0d12" strokeWidth="1.4" strokeLinejoin="round" /></svg>
      </span>
      <span className={`font-display text-xl font-black tracking-tight ${dark ? "text-white" : "text-fg"}`}>KAUP</span>
    </span>
  );
}
