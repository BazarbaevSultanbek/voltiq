export function CardBrands({ active, size = "md" }: { active?: string; size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-6" : "h-8";
  const dim = (b: string) => (active && active !== b ? "opacity-30 grayscale" : "");
  return (
    <div className="flex items-center gap-2">
      <span className={`${h} ${dim("visa")} grid aspect-[1.6] place-items-center rounded-md bg-white px-1.5 transition`} title="Visa">
        <svg viewBox="0 0 48 16" className="w-full"><text x="24" y="13" textAnchor="middle" fontFamily="Arial" fontStyle="italic" fontWeight="900" fontSize="15" fill="#1a1f71">VISA</text></svg>
      </span>
      <span className={`${h} ${dim("mastercard")} grid aspect-[1.6] place-items-center rounded-md bg-white transition`} title="Mastercard">
        <svg viewBox="0 0 40 24" className="h-[70%]"><circle cx="15" cy="12" r="10" fill="#eb001b" /><circle cx="25" cy="12" r="10" fill="#f79e1b" fillOpacity=".9" /><path d="M20 4a10 10 0 0 1 0 16 10 10 0 0 1 0-16z" fill="#ff5f00" /></svg>
      </span>
      <span className={`${h} ${dim("unionpay")} grid aspect-[1.6] place-items-center overflow-hidden rounded-md bg-white transition`} title="UnionPay">
        <svg viewBox="0 0 48 30" className="h-full"><path d="M6 3h12l-6 24H0z" fill="#e21836" /><path d="M18 3h12l-6 24H12z" fill="#00447c" /><path d="M30 3h12l-6 24H24z" fill="#007b84" /><text x="24" y="19" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="8" fill="#fff">UnionPay</text></svg>
      </span>
    </div>
  );
}
