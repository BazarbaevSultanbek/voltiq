"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Copy, ExternalLink, Loader2, LogOut } from "lucide-react";

const STATUSES = ["paid", "processing", "shipped", "delivered", "cancelled"];

export function LogoutButton() {
  const router = useRouter();
  return <button onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); router.refresh(); }} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-white/60 hover:bg-white/10 hover:text-white"><LogOut size={16} />Log out</button>;
}

export function StatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [v, setV] = useState(status);
  const [busy, setBusy] = useState(false);
  return (
    <span className="flex items-center gap-1">
      <select value={v} disabled={busy} onClick={(e) => e.stopPropagation()} onChange={async (e) => {
        const s = e.target.value; setBusy(true);
        const r = await fetch("/api/admin/orders", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status: s }) });
        setBusy(false);
        if (r.ok) { setV(s); toast.success(`Status → ${s}. Customer notified.`); router.refresh(); } else toast.error("Failed");
      }} className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-bold">
        {[status, ...STATUSES.filter((s) => s !== status)].map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      {busy && <Loader2 size={14} className="animate-spin" />}
    </span>
  );
}

export function OrderDetails({ json, supplierLinks }: { json: string; supplierLinks: { title: string; url?: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-xs font-bold text-volt">{open ? "Hide" : "View"} order object <ChevronDown size={14} className={open ? "rotate-180" : ""} /></button>
      {open && (
        <div className="mt-2 space-y-2">
          {supplierLinks.some((s) => s.url) && (
            <div className="rounded-xl bg-lime/30 p-3 text-xs">
              <p className="mb-1 font-bold">Buy from supplier:</p>
              {supplierLinks.map((s, i) => s.url ? <a key={i} href={s.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-semibold underline">{s.title}<ExternalLink size={12} /></a> : null)}
            </div>
          )}
          <div className="relative">
            <button onClick={() => { navigator.clipboard.writeText(json); toast.success("Copied"); }} className="absolute right-2 top-2 rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20" aria-label="Copy"><Copy size={14} /></button>
            <pre className="max-h-96 overflow-auto rounded-xl bg-ink p-4 text-[11px] leading-relaxed text-lime">{json}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductToggle({ id, field, value }: { id: string; field: "active" | "featured"; value: boolean }) {
  const router = useRouter();
  const [v, setV] = useState(value);
  return (
    <button onClick={async () => {
      const r = await fetch("/api/admin/products", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, [field]: !v }) });
      if (r.ok) { setV(!v); router.refresh(); }
    }} className={`relative h-5 w-9 rounded-full transition ${v ? "bg-volt" : "bg-line"}`} aria-label={field}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${v ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}

export function ProductCost({ id, cost, margin }: { id: string; cost: number; margin: number | null }) {
  const router = useRouter();
  const [c, setC] = useState(String(cost));
  const [m, setM] = useState(margin == null ? "" : String(margin));
  const dirty = c !== String(cost) || m !== (margin == null ? "" : String(margin));
  return (
    <span className="flex items-center gap-1">
      <input className="w-16 rounded-lg border border-line px-1.5 py-1 text-xs" value={c} onChange={(e) => setC(e.target.value)} aria-label="cost" />
      <input className="w-14 rounded-lg border border-line px-1.5 py-1 text-xs" placeholder="global" value={m} onChange={(e) => setM(e.target.value)} aria-label="margin %" />
      {dirty && <button className="rounded-lg bg-ink px-2 py-1 text-[10px] font-bold text-white" onClick={async () => {
        const r = await fetch("/api/admin/products", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, costPrice: Number(c), marginPct: m === "" ? null : Number(m) }) });
        if (r.ok) { toast.success("Re-priced"); router.refresh(); } else toast.error("Invalid");
      }}>Save</button>}
    </span>
  );
}

export function SettingsForm({ marginPct, freeShippingOver }: { marginPct: number; freeShippingOver: number }) {
  const router = useRouter();
  const [m, setM] = useState(String(marginPct));
  const [fs, setFs] = useState(String(freeShippingOver));
  const [busy, setBusy] = useState(false);
  const example = 10 * (1 + Number(m || 0) / 100);
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true);
      const r = await fetch("/api/admin/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ marginPct: Number(m), freeShippingOver: Number(fs) }) });
      setBusy(false); const d = await r.json();
      if (r.ok) { toast.success(`Saved. ${d.repriced} products re-priced.`); router.refresh(); } else toast.error("Invalid values");
    }}>
      <div><label className="label" htmlFor="mg">Profit margin (%)</label><input id="mg" className="input" inputMode="decimal" value={m} onChange={(e) => setM(e.target.value)} />
        <p className="mt-1 text-xs text-muted">Example: supplier cost $10.00 → customer price ${(Math.ceil(example) - 0.01).toFixed(2)} (rounded to .99)</p></div>
      <div><label className="label" htmlFor="fs">Free standard shipping over ($)</label><input id="fs" className="input" inputMode="decimal" value={fs} onChange={(e) => setFs(e.target.value)} /><p className="mt-1 text-xs text-muted">Set 0 to disable free shipping.</p></div>
      <button className="btn btn-primary" disabled={busy}>{busy && <Loader2 size={16} className="animate-spin" />}Save & re-price all products</button>
    </form>
  );
}

export function ImportForm({ categories, enabled }: { categories: { slug: string; label: string }[]; enabled: boolean }) {
  const router = useRouter();
  const [f, setF] = useState({ keywords: "", category: categories[0]?.slug || "", count: "20" });
  const [busy, setBusy] = useState(false);
  return (
    <form className="space-y-3" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true);
      const r = await fetch("/api/admin/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...f, count: Number(f.count) }) });
      const d = await r.json(); setBusy(false);
      if (r.ok) { toast.success(`Found ${d.found}: ${d.created} new, ${d.updated} updated`); router.refresh(); } else toast.error(d.error || "Import failed");
    }}>
      {!enabled && <p className="rounded-xl bg-volt/10 p-3 text-xs font-semibold text-volt-dark">Add ALIEXPRESS_APP_KEY and ALIEXPRESS_APP_SECRET in Vercel to enable importing.</p>}
      <input className="input" placeholder="Keywords, e.g. magnetic power bank" value={f.keywords} onChange={(e) => setF({ ...f, keywords: e.target.value })} required />
      <div className="grid grid-cols-[1fr_90px] gap-2">
        <select className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select>
        <input className="input" inputMode="numeric" value={f.count} onChange={(e) => setF({ ...f, count: e.target.value })} aria-label="count" />
      </div>
      <button className="btn btn-dark w-full" disabled={busy || !enabled}>{busy && <Loader2 size={16} className="animate-spin" />}Import from AliExpress</button>
    </form>
  );
}

export function AddProductForm({ categories }: { categories: { slug: string; label: string }[] }) {
  const router = useRouter();
  const blank = { title: "", category: categories[0]?.slug || "", costPrice: "", supplierCompareAt: "", images: "", sourceUrl: "", description: "", tags: "" };
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="space-y-3" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true);
      const body = { title: f.title, category: f.category, costPrice: Number(f.costPrice), supplierCompareAt: Number(f.supplierCompareAt || 0), images: f.images.split(/\s+/).filter(Boolean), sourceUrl: f.sourceUrl, description: f.description, tags: f.tags.split(",").map((s) => s.trim()).filter(Boolean) };
      const r = await fetch("/api/admin/products", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      setBusy(false);
      if (r.ok) { toast.success("Product added"); setF(blank); router.refresh(); } else toast.error("Check the fields (images must be full https URLs)");
    }}>
      <input className="input" placeholder="Title" value={f.title} onChange={set("title")} required />
      <div className="grid grid-cols-3 gap-2">
        <select className="input" value={f.category} onChange={set("category")}>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select>
        <input className="input" placeholder="Supplier cost $" inputMode="decimal" value={f.costPrice} onChange={set("costPrice")} required />
        <input className="input" placeholder="Supplier was $" inputMode="decimal" value={f.supplierCompareAt} onChange={set("supplierCompareAt")} />
      </div>
      <textarea className="input min-h-16" placeholder="Image URLs (one per line)" value={f.images} onChange={set("images")} required />
      <input className="input" placeholder="Alibaba / AliExpress product link" value={f.sourceUrl} onChange={set("sourceUrl")} />
      <textarea className="input min-h-16" placeholder="Description" value={f.description} onChange={set("description")} />
      <input className="input" placeholder="Search tags, comma separated" value={f.tags} onChange={set("tags")} />
      <button className="btn btn-primary w-full" disabled={busy}>{busy && <Loader2 size={16} className="animate-spin" />}Add product</button>
    </form>
  );
}
