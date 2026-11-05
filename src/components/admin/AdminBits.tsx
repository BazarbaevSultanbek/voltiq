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
      }} className="rounded-lg border border-line bg-surface px-2 py-1 text-xs font-bold">
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
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-surface shadow transition-all ${v ? "left-[18px]" : "left-0.5"}`} />
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

export function SettingsForm({ marginPct, freeShippingOver, cjAutoOrder = true }: { marginPct: number; freeShippingOver: number; cjAutoOrder?: boolean }) {
  const router = useRouter();
  const [m, setM] = useState(String(marginPct));
  const [fs, setFs] = useState(String(freeShippingOver));
  const [auto, setAuto] = useState(cjAutoOrder);
  const [busy, setBusy] = useState(false);
  const example = 10 * (1 + Number(m || 0) / 100);
  return (
    <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true);
      const r = await fetch("/api/admin/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ marginPct: Number(m), freeShippingOver: Number(fs), cjAutoOrder: auto }) });
      setBusy(false); const d = await r.json();
      if (r.ok) { toast.success(`Saved. ${d.repriced} products re-priced.`); router.refresh(); } else toast.error("Invalid values");
    }}>
      <div><label className="label" htmlFor="mg">Profit margin (%)</label><input id="mg" className="input" inputMode="decimal" value={m} onChange={(e) => setM(e.target.value)} />
        <p className="mt-1 text-xs text-muted">Example: supplier cost $10.00 → customer price ${(Math.ceil(example) - 0.01).toFixed(2)} (rounded to .99)</p></div>
      <div><label className="label" htmlFor="fs">Free standard shipping over ($)</label><input id="fs" className="input" inputMode="decimal" value={fs} onChange={(e) => setFs(e.target.value)} /><p className="mt-1 text-xs text-muted">Set 0 to disable free shipping.</p></div>
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-cream p-3 text-sm"><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="mt-1 h-4 w-4 accent-[#ff5b14]" /><span><b>Auto-send paid orders to CJ</b><br /><span className="text-xs text-muted">Paid from your CJ balance right after the customer pays. Turn off to review each order first.</span></span></label>
      <button className="btn btn-primary" disabled={busy}>{busy && <Loader2 size={16} className="animate-spin" />}Save & re-price all products</button>
    </form>
  );
}

export function ImportForm({ categories, enabled, endpoint = "/api/admin/import", source = "AliExpress", envHint = "ALIEXPRESS_APP_KEY and ALIEXPRESS_APP_SECRET", max = 50 }: { categories: { slug: string; label: string }[]; enabled: boolean; endpoint?: string; source?: string; envHint?: string; max?: number }) {
  const router = useRouter();
  const [f, setF] = useState({ keywords: "", category: categories[0]?.slug || "", count: String(Math.min(10, max)) });
  const [busy, setBusy] = useState(false);
  return (
    <form className="space-y-3" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true);
      const r = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...f, count: Math.min(max, Number(f.count)) }) });
      const d = await r.json(); setBusy(false);
      if (r.ok) { toast.success(`Found ${d.found}: ${d.created} new, ${d.updated} updated${d.failed ? `, ${d.failed} failed` : ""}`); router.refresh(); } else toast.error(d.error || "Import failed");
    }}>
      {!enabled && <p className="rounded-xl bg-volt/10 p-3 text-xs font-semibold text-volt-dark">Add {envHint} in Vercel to enable importing.</p>}
      <input className="input" placeholder="Keywords, e.g. magnetic power bank" value={f.keywords} onChange={(e) => setF({ ...f, keywords: e.target.value })} required />
      <div className="grid grid-cols-[1fr_90px] gap-2">
        <select className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select>
        <input className="input" inputMode="numeric" value={f.count} onChange={(e) => setF({ ...f, count: e.target.value })} aria-label="count" />
      </div>
      <button className="btn btn-dark w-full" disabled={busy || !enabled}>{busy && <Loader2 size={16} className="animate-spin" />}{busy ? "Importing… (about 1 product per second)" : `Import from ${source}`}</button>
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

type Supplier = { provider?: string; orderId?: string; status?: string; logisticName?: string; trackNumber?: string; error?: string; cost?: number } | null;

export function SupplierPanel({ id, supplier, eligible, total }: { id: string; supplier: Supplier; eligible: boolean; total: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const act = async (action: "send" | "sync") => {
    setBusy(action);
    const r = await fetch("/api/admin/cj/order", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, action }) });
    const d = await r.json(); setBusy(null);
    if (!r.ok) return toast.error(d.error || "Failed");
    if (d.supplier?.error) toast.error(d.supplier.error); else toast.success(action === "send" ? `Sent to CJ: ${d.supplier?.orderId}` : `CJ status: ${d.supplier?.status}`);
    router.refresh();
  };
  if (!eligible && !supplier) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-cream px-3 py-2 text-xs">
      <b>CJ</b>
      {supplier?.orderId ? (
        <>
          <span>#{supplier.orderId}</span><span className="rounded bg-surface px-1.5 font-bold">{supplier.status}</span>
          {supplier.logisticName && <span className="text-muted">{supplier.logisticName}</span>}
          {supplier.cost != null && <><span className="text-muted">CJ cost ${Number(supplier.cost).toFixed(2)}</span><span className={`font-black ${total - supplier.cost >= 0 ? "text-ok" : "text-berry"}`}>profit ${(total - Number(supplier.cost)).toFixed(2)}</span></>}
          {supplier.trackNumber ? <a className="font-bold text-volt underline" target="_blank" rel="noreferrer" href={`https://t.17track.net/en#nums=${supplier.trackNumber}`}>{supplier.trackNumber}</a> : <span className="text-muted">no tracking yet</span>}
          <button onClick={() => act("sync")} disabled={!!busy} className="ml-auto rounded-lg bg-ink px-2 py-1 font-bold text-white">{busy === "sync" ? "…" : "Sync"}</button>
        </>
      ) : (
        <>
          {supplier?.error ? <span className="font-semibold text-berry">⚠ {supplier.error}</span> : <span className="text-muted">Not sent yet</span>}
          <button onClick={() => act("send")} disabled={!!busy} className="ml-auto rounded-lg bg-volt px-2 py-1 font-bold text-white">{busy === "send" ? "Sending…" : "Send to CJ"}</button>
        </>
      )}
    </div>
  );
}

export function SyncAllButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button disabled={busy} onClick={async () => {
      setBusy(true); const r = await fetch("/api/admin/cj/sync", { method: "POST" }); const d = await r.json(); setBusy(false);
      if (r.ok) { toast.success(`Checked ${d.checked} orders on CJ`); router.refresh(); } else toast.error(d.error || "Failed");
    }} className="btn btn-dark py-2 text-sm">{busy && <Loader2 size={14} className="animate-spin" />}Sync tracking from CJ</button>
  );
}

/**
 * One-click CJ import: no keywords to type. Each category uses its own search words
 * and only keeps products whose title fits the category. "All categories" runs one
 * request per category so each stays inside the serverless time limit.
 */
export function AutoImport({ categories, enabled }: { categories: { slug: string; label: string }[]; enabled: boolean }) {
  const router = useRouter();
  const [cat, setCat] = useState("all");
  const [count, setCount] = useState("8");
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const post = (body: object) => fetch("/api/admin/cj/auto", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then(async (r) => ({ ok: r.ok, d: await r.json() }));

  const run = async () => {
    const list = cat === "all" ? categories : categories.filter((c) => c.slug === cat);
    const n = Math.max(1, Math.min(100, Number(count) || 8));
    setLog([]);
    let total = 0;
    outer: for (const [i, c] of list.entries()) {
      // Each request imports a batch of up to 15 (to fit the server time limit);
      // keep asking until this category has n new products or CJ runs out of matches.
      let added = 0, rejected = 0, failed = 0, error = "";
      for (let tries = 0; added < n && tries < 15; tries++) {
        setBusy(`${c.label} (${i + 1}/${list.length}) — ${added}/${n}…`);
        const { ok, d } = await post({ action: "import", category: c.slug, count: Math.min(15, n - added) });
        if (!ok) { error = d.error || "failed"; break; }
        added += d.created; rejected += d.rejected; failed += d.failed;
        if (d.created === 0 && !d.timedOut) break; // nothing new left for this category
      }
      total += added;
      setLog((l) => [...l, `${c.label}: ${added} added${added < n && !error ? " (no more matching products found)" : ""}${rejected ? `, ${rejected} off-topic skipped` : ""}${failed ? `, ${failed} failed` : ""}${error ? ` — ${error}` : ""}`]);
      if (/CJ_API_KEY|auth/i.test(error)) break outer;
    }
    toast.success(`Done — ${total} products added`);
    // Translate the new products right away (skipped if translation isn't set up).
    if (total > 0) {
      try { const r = await translateAll(setBusy); setLog((l) => [...l, `Translated ${r.total} products${r.remaining > 0 ? `, ${r.remaining} still waiting` : ""}`]); }
      catch (e) { setLog((l) => [...l, `Translation skipped: ${(e as Error).message}`]); }
    }
    setBusy(null);
    router.refresh();
  };

  const cleanup = async () => {
    setBusy("Checking products…");
    const { ok, d } = await post({ action: "cleanup" });
    setBusy(null);
    if (ok) { toast.success(`Checked ${d.checked}, hid ${d.hidden} off-topic`); router.refresh(); } else toast.error(d.error || "Failed");
  };

  return (
    <div className="space-y-3">
      {!enabled && <p className="rounded-xl bg-volt/10 p-3 text-xs font-semibold text-volt-dark">Add CJ_API_KEY in Vercel to enable importing.</p>}
      <p className="text-xs text-muted">Picks products for each category automatically and skips anything that doesn&apos;t fit it. Run it again to get more.</p>
      <div className="grid grid-cols-[1fr_90px] gap-2">
        <select className="input" value={cat} onChange={(e) => setCat(e.target.value)} disabled={!!busy}>
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
        </select>
        <input className="input" inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value.replace(/\D/g, ""))} aria-label="Products per category" title="Products per category (max 100)" disabled={!!busy} />
      </div>
      <button className="btn btn-dark w-full" disabled={!!busy || !enabled} onClick={run}>{busy && <Loader2 size={16} className="animate-spin" />}{busy ?? "Import automatically"}</button>
      <button className="w-full text-xs font-bold text-volt disabled:opacity-40" disabled={!!busy || !enabled} onClick={cleanup}>Hide products that don&apos;t fit their category</button>
      {log.length > 0 && <ul className="max-h-40 space-y-0.5 overflow-auto rounded-xl bg-cream p-3 text-xs">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>}
    </div>
  );
}

type AdminUser = { id: string; name: string; email: string; username: string; phone: string };
const USER_ERRORS: Record<string, string> = { email_taken: "Another account already uses this email", username_taken: "That username is taken", invalid_input: "Check the fields (email, phone, username: 3-30 letters/numbers)" };

/** Edit / delete buttons for one row of the admin Users table. */
export function UserActions({ user }: { user: AdminUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(user);
  const [busy, setBusy] = useState(false);
  const call = (method: "PATCH" | "DELETE", body: object) => fetch("/api/admin/users", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then(async (r) => ({ ok: r.ok, d: await r.json().catch(() => ({})) }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { ok, d } = await call("PATCH", { id: user.id, name: f.name, email: f.email, username: f.username, phone: f.phone });
    setBusy(false);
    if (ok) { toast.success("User updated"); setOpen(false); router.refresh(); } else toast.error(USER_ERRORS[d.error] || d.error || "Failed");
  };
  const del = async () => {
    if (!confirm(`Delete ${user.email}?\n\nTheir account, saved addresses, notifications and reviews are removed. Their past orders stay in Orders. This can't be undone.`)) return;
    setBusy(true);
    const { ok, d } = await call("DELETE", { id: user.id });
    setBusy(false);
    if (ok) { toast.success("User deleted"); router.refresh(); } else toast.error(d.error || "Failed");
  };

  return (
    <>
      <div className="flex gap-1.5">
        <button onClick={() => { setF(user); setOpen(true); }} className="rounded-lg bg-cream px-3 py-1.5 text-xs font-bold hover:bg-line">Edit</button>
        <button onClick={del} disabled={busy} className="rounded-lg px-3 py-1.5 text-xs font-bold text-berry hover:bg-berry/10 disabled:opacity-40">Delete</button>
      </div>
      {open && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-ink/50 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-3 rounded-3xl bg-paper p-6 text-left shadow-2xl">
            <p className="font-display text-lg font-bold">Edit user</p>
            {([["name", "Name"], ["email", "Email"], ["username", "Username"], ["phone", "Phone"]] as const).map(([k, l]) => (
              <label key={k} className="block"><span className="label">{l}</span>
                <input className="input" type={k === "email" ? "email" : k === "phone" ? "tel" : "text"} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} required={k === "email"} />
              </label>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">Cancel</button>
              <button className="btn btn-dark" disabled={busy}>{busy && <Loader2 size={16} className="animate-spin" />}Save</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

/** On/off switch and target for the daily automatic CJ import. */
export function AutoImportSchedule({ enabled, target, last }: { enabled: boolean; target: number; last: { at?: string; created?: number; note?: string } | null }) {
  const router = useRouter();
  const [on, setOn] = useState(enabled);
  const [n, setN] = useState(String(target));
  const [busy, setBusy] = useState(false);
  const save = async (nextOn = on) => {
    setBusy(true);
    const r = await fetch("/api/admin/cj/auto", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "settings", enabled: nextOn, target: Math.max(5, Math.min(500, Number(n) || 40)) }) });
    setBusy(false);
    if (r.ok) { toast.success("Saved"); router.refresh(); } else toast.error("Failed");
  };
  return (
    <div className="space-y-2 rounded-2xl bg-cream p-3 text-sm">
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={on} disabled={busy} onChange={(e) => { setOn(e.target.checked); save(e.target.checked); }} className="mt-1 h-4 w-4 accent-[#ff5b14]" />
        <span><b>Import new products automatically every day</b><br /><span className="text-xs text-muted">Each night it adds on-topic products to the emptiest categories (about 30–40 a day) until each has the target below.</span></span>
      </label>
      <div className="flex items-center gap-2 pl-7">
        <span className="text-xs font-semibold">Target per category</span>
        <input className="input w-20 py-1.5" inputMode="numeric" value={n} onChange={(e) => setN(e.target.value.replace(/\D/g, ""))} />
        <button type="button" onClick={() => save()} disabled={busy} className="rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40">Save</button>
      </div>
      <p className="pl-7 text-xs text-muted">{last?.at ? `Last run ${new Date(last.at).toLocaleString()}: ${last.created ?? 0} added — ${last.note ?? ""}` : "Hasn't run yet — first run tonight (03:30 UTC)."}</p>
    </div>
  );
}

/** Translate untranslated products batch by batch until done (or nothing more succeeds). */
async function translateAll(onProgress: (msg: string) => void) {
  let total = 0;
  for (let round = 0; round < 200; round++) {
    const r = await fetch("/api/admin/translate", { method: "POST" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "Translation failed");
    total += d.translated;
    onProgress(`Translating… ${total} done, ${d.remaining} left`);
    if (d.remaining === 0 || d.translated === 0) return { total, remaining: d.remaining as number, failed: d.failed as number };
  }
  return { total, remaining: -1, failed: 0 };
}

/** Admin button: translate product names and descriptions into every store language. */
export function TranslateButton({ pending, enabled }: { pending: number; enabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const run = async () => {
    setBusy("Starting…");
    try {
      const r = await translateAll(setBusy);
      if (r.remaining > 0) toast.warning(`${r.total} translated; ${r.remaining} couldn't be translated right now — try again later.`);
      else toast.success(`${r.total} products translated`);
    } catch (e) { toast.error((e as Error).message); }
    setBusy(null); router.refresh();
  };
  return (
    <div className="space-y-2">
      {!enabled && <p className="rounded-xl bg-volt/10 p-3 text-xs font-semibold text-volt-dark">Add ANTHROPIC_API_KEY in Vercel to enable translation.</p>}
      <p className="text-xs text-muted">{pending ? `${pending} products aren't translated yet.` : "All products are translated."} New products are also translated automatically each night.</p>
      <button className="btn btn-dark w-full" disabled={!!busy || !enabled || !pending} onClick={run}>{busy && <Loader2 size={16} className="animate-spin" />}{busy ?? "Translate now"}</button>
    </div>
  );
}

/** Admin: remove a review (spam, abuse). */
export function DeleteReview({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button disabled={busy} onClick={async () => {
      if (!confirm("Delete this review? The product's average rating is recalculated.")) return;
      setBusy(true);
      const r = await fetch("/api/admin/reviews", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
      setBusy(false);
      if (r.ok) { toast.success("Review deleted"); router.refresh(); } else toast.error("Failed");
    }} className="rounded-lg px-3 py-1.5 text-xs font-bold text-berry hover:bg-berry/10 disabled:opacity-40">Delete</button>
  );
}
