"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BadgeCheck, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { formatDate } from "@/i18n/date";

export type PublicReview = { _id: string; rating: number; text: string; name: string; createdAt: string };
type Me = { signedIn: boolean; canReview: boolean; mine: { rating: number; text: string } | null };

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} className={i <= Math.round(value) ? "fill-volt text-volt" : "text-line"} />)}
    </span>
  );
}

/** Reviews for one product: summary, the list, and a form for customers who bought it. */
export function Reviews({ productId, rating, count, reviews }: { productId: string; rating: number | null; count: number; reviews: PublicReview[] }) {
  const { t, locale, href } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/reviews?product=${productId}`).then((r) => r.json()).then((d: Me) => {
      if (!alive) return;
      setMe(d);
      if (d.mine) { setStars(d.mine.rating); setText(d.mine.text); }
    }).catch(() => {});
    return () => { alive = false; };
  }, [productId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stars) return toast.error(t("reviews.pickStars"));
    setBusy(true);
    const r = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ product: productId, rating: stars, text }) });
    setBusy(false);
    if (!r.ok) return toast.error(t("common.error"));
    toast.success(t("reviews.thanks"));
    setMe((m) => (m ? { ...m, mine: { rating: stars, text } } : m));
    router.refresh();
  };

  const date = (s: string) => formatDate(locale, s, { day: "numeric", month: "short", year: "numeric" });

  return (
    <section id="reviews" className="mt-20 scroll-mt-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-3xl font-black">{t("reviews.title")}</h2>
        {count > 0 && rating != null && (
          <div className="flex items-center gap-3"><span className="font-display text-4xl font-black">{rating.toFixed(1)}</span><div><Stars value={rating} size={18} /><p className="text-sm text-muted">{t("product.reviews", { n: count })}</p></div></div>
        )}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <ul className="divide-y divide-line">
          {reviews.length === 0 && <li className="rounded-2xl bg-cream p-6 text-muted">{t("reviews.empty")}</li>}
          {reviews.map((r) => (
            <li key={r._id} className="py-5 first:pt-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Stars value={r.rating} />
                <b>{r.name}</b>
                <span className="flex items-center gap-1 text-xs font-semibold text-ok"><BadgeCheck size={14} />{t("reviews.verified")}</span>
                <span className="text-xs text-muted">{date(r.createdAt)}</span>
              </div>
              {r.text && <p className="mt-2 whitespace-pre-line break-words text-[15px] leading-relaxed">{r.text}</p>}
            </li>
          ))}
        </ul>

        <div className="h-fit rounded-3xl bg-cream p-6 lg:sticky lg:top-28">
          {!me ? (
            <Loader2 className="mx-auto animate-spin text-muted" />
          ) : !me.signedIn ? (
            <Link href={href(`/login?callbackUrl=${encodeURIComponent(pathname + "#reviews")}`)} className="btn btn-dark w-full">{t("reviews.signIn")}</Link>
          ) : !me.canReview ? (
            <p className="text-sm text-muted">{t("reviews.onlyBuyers")}</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <p className="font-display text-lg font-bold">{me.mine ? t("reviews.edit") : t("reviews.write")}</p>
              <div>
                <p className="label">{t("reviews.yourRating")}</p>
                <div className="flex gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label={t("reviews.yourRating")}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button key={i} type="button" role="radio" aria-checked={stars === i} aria-label={`${i}`} onMouseEnter={() => setHover(i)} onClick={() => setStars(i)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface">
                      <Star size={26} className={cn("transition", i <= (hover || stars) ? "fill-volt text-volt" : "text-muted")} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea className="input min-h-28" maxLength={2000} placeholder={t("reviews.placeholder")} value={text} onChange={(e) => setText(e.target.value)} />
              <button className="btn btn-primary w-full" disabled={busy}>{busy && <Loader2 size={16} className="animate-spin" />}{me.mine ? t("reviews.update") : t("reviews.submit")}</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
