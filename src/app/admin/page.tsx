import Link from "next/link";
import { connection } from "next/server";
import { BarChart3, Boxes, Flame, LayoutDashboard, Package, Settings2, Users, CheckCircle2, XCircle } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { Product } from "@/models/Product";
import { SearchStat } from "@/models/SearchStat";
import { getSettings } from "@/lib/settings";
import { CATEGORIES } from "@/lib/catalog";
import { countryName } from "@/lib/shipping";
import { aliEnabled } from "@/lib/aliexpress";
import { cjEnabled } from "@/lib/cj";
import { translateEnabled } from "@/lib/translate";
import { Settings } from "@/models/Settings";
import { stripeEnabled } from "@/lib/stripe";
import { providerFlags } from "@/auth";
import en from "@/i18n/messages/en.json";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { LogoutButton, StatusSelect, OrderDetails, ProductToggle, ProductCost, SettingsForm, ImportForm, AddProductForm, SupplierPanel, SyncAllButton, AutoImport, UserActions, AutoImportSchedule, TranslateButton } from "@/components/admin/AdminBits";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

const TABS = [
  ["overview", "Overview", LayoutDashboard], ["orders", "Orders", Package], ["users", "Users", Users],
  ["interests", "Interests", Flame], ["products", "Products", Boxes], ["settings", "Settings", Settings2],
] as const;

const $ = (n: number) => `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const d = (x: unknown) => (x ? new Date(x as string).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—");
const catLabel = (s: string) => (en.cat as Record<string, string>)[s] || s;
const BADGE: Record<string, string> = { paid: "bg-sky/15 text-sky", processing: "bg-volt/15 text-volt-dark", shipped: "bg-purple-500/15 text-purple-700", delivered: "bg-ok/15 text-ok", cancelled: "bg-berry/15 text-berry", pending_payment: "bg-line text-muted" };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await connection();
  if (!(await isAdmin())) return <AdminLogin />;
  const { tab = "overview" } = await searchParams;
  await db();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-night p-4 text-white md:flex">
        <div className="px-2 py-3"><Logo dark /></div>
        <nav className="mt-6 flex-1 space-y-1">
          {TABS.map(([id, label, Icon]) => (
            <Link key={id} href={`/admin?tab=${id}`} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${tab === id ? "bg-volt text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}><Icon size={18} />{label}</Link>
          ))}
        </nav>
        <ThemeToggle className="mb-2 text-white hover:bg-white/10" />
        <Link href="/" className="mb-1 rounded-xl px-3 py-2 text-sm font-bold text-white/60 hover:bg-white/10 hover:text-white">↗ View store</Link>
        <LogoutButton />
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-8">
        <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto md:hidden">
          {TABS.map(([id, label]) => <Link key={id} href={`/admin?tab=${id}`} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${tab === id ? "bg-ink text-white" : "bg-surface"}`}>{label}</Link>)}
        </div>
        {tab === "overview" && <Overview />}
        {tab === "orders" && <Orders />}
        {tab === "users" && <UsersTab />}
        {tab === "interests" && <Interests />}
        {tab === "products" && <Products />}
        {tab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}

function H({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return <div className="mb-6"><h1 className="font-display text-3xl font-black">{children}</h1>{sub && <p className="mt-1 text-sm text-muted">{sub}</p>}</div>;
}
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-3xl bg-surface p-5 ring-1 ring-line ${className}`}>{children}</div>;
}

async function Overview() {
  const paidStatuses = ["paid", "processing", "shipped", "delivered"] as const;
  const since = new Date(Date.now() - 13 * 864e5); since.setHours(0, 0, 0, 0);
  const [rev, orders, users, products, recent, daily, topSearch] = await Promise.all([
    Order.aggregate([{ $match: { status: { $in: paidStatuses } } }, { $group: { _id: null, total: { $sum: "$total" }, n: { $sum: 1 }, cost: { $sum: "$subtotal" } } }]),
    Order.countDocuments({ status: { $ne: "pending_payment" } }),
    User.countDocuments(),
    Product.countDocuments({ active: true }),
    Order.find({ status: { $ne: "pending_payment" } }).sort({ createdAt: -1 }).limit(6).lean(),
    Order.find({ status: { $in: paidStatuses }, createdAt: { $gte: since } }).select("total createdAt").lean(),
    SearchStat.find().sort({ count: -1 }).limit(5).lean(),
  ]);
  const days = Array.from({ length: 14 }, (_, i) => { const x = new Date(since); x.setDate(x.getDate() + i); return { key: x.toISOString().slice(0, 10), label: x.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), v: 0 }; });
  for (const o of daily) { const k = new Date(o.createdAt).toISOString().slice(0, 10); const day = days.find((x) => x.key === k); if (day) day.v += o.total || 0; }
  const max = Math.max(1, ...days.map((x) => x.v));
  const r = rev[0] || { total: 0, n: 0 };
  const stats = [["Revenue", $(r.total)], ["Orders", orders], ["Avg. order", $(r.n ? r.total / r.n : 0)], ["Users", users], ["Live products", products]];

  return (
    <>
      <H sub="Store performance at a glance">Overview</H>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map(([l, v]) => <Card key={l as string}><p className="text-xs font-bold uppercase tracking-wider text-muted">{l}</p><p className="mt-2 font-display text-2xl font-black">{v}</p></Card>)}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <p className="mb-4 flex items-center gap-2 font-display font-bold"><BarChart3 size={18} className="text-volt" />Revenue — last 14 days</p>
          <div className="flex h-48 items-end gap-1.5">
            {days.map((x) => (
              <div key={x.key} className="group flex flex-1 flex-col items-center gap-1" title={`${x.label}: ${$(x.v)}`}>
                <span className="text-[10px] font-bold text-muted opacity-0 group-hover:opacity-100">{x.v ? $(x.v) : ""}</span>
                <div className="w-full rounded-t-md bg-volt/80 transition group-hover:bg-volt" style={{ height: `${Math.max(2, (x.v / max) * 150)}px` }} />
                <span className="text-[9px] text-muted">{x.label.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <p className="mb-3 flex items-center gap-2 font-display font-bold"><Flame size={18} className="text-volt" />Top searches</p>
          {topSearch.length === 0 ? <p className="text-sm text-muted">No searches yet.</p> : (
            <ol className="space-y-2">{topSearch.map((s, i) => <li key={s.term} className="flex justify-between text-sm"><span><b className="text-muted">{i + 1}.</b> {s.term}</span><b>{s.count}</b></li>)}</ol>
          )}
          <Link href="/admin?tab=interests" className="mt-4 inline-block text-xs font-bold text-volt">See all →</Link>
        </Card>
      </div>
      <Card className="mt-6">
        <p className="mb-3 font-display font-bold">Recent orders</p>
        {recent.length === 0 ? <p className="text-sm text-muted">No orders yet.</p> : (
          <div className="divide-y divide-line">{recent.map((o) => (
            <div key={String(o._id)} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <b className="font-display">{o.number}</b>
              <span className="text-muted">{o.address?.fullName} · {o.address?.city}, {countryName(o.address?.country)}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-black ${BADGE[o.status]}`}>{o.status}</span>
              {o.payment?.provider === "test" && <span className="rounded-full bg-lime px-2 py-0.5 text-[10px] font-black">TEST</span>}
              <span className="ml-auto font-bold">{$(o.total!)}</span>
            </div>))}
          </div>
        )}
      </Card>
    </>
  );
}

async function Orders() {
  const orders = await Order.find({}).sort({ createdAt: -1 }).limit(200).lean();
  const ids = [...new Set(orders.flatMap((o) => o.items.map((i) => String(i.product))))];
  const plist = await Product.find({ _id: { $in: ids } }).select("sourceUrl source").lean();
  const src = new Map(plist.map((p) => [String(p._id), p.sourceUrl]));
  const isCj = new Map(plist.map((p) => [String(p._id), p.source === "cj"]));
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3"><H sub="Every order is stored as a full object in MongoDB (collection: orders). Changing a status notifies the customer.">Orders ({orders.length})</H>{cjEnabled() && <SyncAllButton />}</div>
      <div className="space-y-3">
        {orders.length === 0 && <Card><p className="text-sm text-muted">No orders yet.</p></Card>}
        {orders.map((o) => (
          <Card key={String(o._id)}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <b className="font-display text-lg">{o.number}</b>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${BADGE[o.status]}`}>{o.status}</span>
              {o.payment?.provider === "test" && <span className="rounded-full bg-lime px-2 py-0.5 text-[10px] font-black">TEST PAYMENT</span>}
              <span className="text-sm text-muted">{d(o.createdAt)}</span>
              <span className="ml-auto font-display text-xl font-black">{$(o.total!)}</span>
              <StatusSelect key={o.status} id={String(o._id)} status={o.status} />
            </div>
            <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
              <div><p className="label">Customer</p><p className="font-bold">{o.address?.fullName}</p><p className="text-muted">{o.email}<br />{o.address?.phone}</p></div>
              <div><p className="label">Deliver to</p><p className="text-muted">{o.address?.line1}{o.address?.line2 ? `, ${o.address.line2}` : ""}<br />{o.address?.city}{o.address?.region ? `, ${o.address.region}` : ""} {o.address?.postal}<br /><b className="text-fg">{countryName(o.address?.country)}</b></p></div>
              <div><p className="label">Shipping & payment</p><p className="text-muted">{o.shippingMethod?.id} · {$(o.shipping!)} · ETA {o.eta?.from ? new Date(o.eta.from).toLocaleDateString("en-GB") : ""}–{o.eta?.to ? new Date(o.eta.to).toLocaleDateString("en-GB") : ""}<br />{o.payment?.brand?.toUpperCase()} •••• {o.payment?.last4}</p></div>
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {o.items.map((i, k) => <li key={k} className="flex items-center gap-2 rounded-xl bg-cream py-1 pl-1 pr-3 text-xs"><img src={i.image!} alt="" className="h-8 w-8 rounded-lg" /><b>{i.qty}×</b> {i.title} <span className="capitalize text-muted">({i.color})</span></li>)}
            </ul>
            {o.status !== "pending_payment" && <div className="mt-3"><SupplierPanel total={o.total!} id={String(o._id)} supplier={o.supplier ? JSON.parse(JSON.stringify(o.supplier)) : null} eligible={cjEnabled() && o.items.every((i) => isCj.get(String(i.product)))} /></div>}
            <div className="mt-3"><OrderDetails json={JSON.stringify(o, null, 2)} supplierLinks={o.items.map((i) => ({ title: i.title!, url: src.get(String(i.product)) ?? undefined }))} /></div>
          </Card>
        ))}
      </div>
    </>
  );
}

async function UsersTab() {
  const [users, stats] = await Promise.all([
    User.find({}).sort({ createdAt: -1 }).limit(500).lean(),
    Order.aggregate([{ $match: { status: { $in: ["paid", "processing", "shipped", "delivered"] } } }, { $group: { _id: "$user", n: { $sum: 1 }, spent: { $sum: "$total" } } }]),
  ]);
  const m = new Map(stats.map((s) => [String(s._id), s]));
  const buyers = users.filter((u) => m.has(String(u._id))).length;
  return (
    <>
      <H sub={`${users.length} signed up · ${buyers} have ordered`}>Users</H>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-cream text-left text-xs uppercase tracking-wider text-muted"><tr>{["User", "Phone", "Sign-in", "Joined", "Last login", "Orders", "Spent", "Address", ""].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => { const s = m.get(String(u._id)); const a = u.addresses?.[0]; return (
              <tr key={String(u._id)} className={s ? "bg-lime/10" : ""}>
                <td className="px-4 py-3"><div className="flex items-center gap-2">{u.image ? <img src={u.image} alt="" className="h-8 w-8 rounded-full object-cover" /> : <span className="grid h-8 w-8 place-items-center rounded-full bg-volt text-xs font-bold text-white">{(u.name || u.email)[0]?.toUpperCase()}</span>}<div><b>{u.name}</b>{u.username && <span className="text-muted"> @{u.username}</span>}<br /><span className="text-xs text-muted">{u.email}</span></div></div></td>
                <td className="px-4 py-3">{u.phone || "—"}</td>
                <td className="px-4 py-3">{u.providers.join(", ")}</td>
                <td className="px-4 py-3 text-xs">{d(u.createdAt)}</td>
                <td className="px-4 py-3 text-xs">{d(u.lastLoginAt)}</td>
                <td className="px-4 py-3 font-bold">{s?.n ?? 0}</td>
                <td className="px-4 py-3 font-bold">{s ? $(s.spent) : "—"}</td>
                <td className="px-4 py-3 text-xs text-muted">{a ? `${a.city}, ${countryName(a.country)}` : "—"}</td>
                <td className="px-4 py-3"><UserActions user={{ id: String(u._id), name: u.name || "", email: u.email, username: u.username || "", phone: u.phone || "" }} /></td>
              </tr>); })}
          </tbody>
        </table>
      </Card>
    </>
  );
}

async function Interests() {
  const [terms, zero, products, catAgg] = await Promise.all([
    SearchStat.find().sort({ count: -1 }).limit(50).lean(),
    SearchStat.find({ lastResults: 0 }).sort({ count: -1 }).limit(15).lean(),
    Product.find({}).select("title images category views cartAdds searchHits sold price").lean().then((all) =>
      all.map((p) => ({ ...p, score: p.sold * 5 + p.cartAdds * 2 + p.searchHits + p.views * 0.3 })).sort((a, b) => b.score - a.score).slice(0, 25)),
    Product.find({}).select("category views cartAdds sold searchHits").lean().then((all) => {
      const m = new Map<string, { _id: string; views: number; carts: number; sold: number; hits: number }>();
      for (const p of all) { const c = m.get(p.category) ?? { _id: p.category, views: 0, carts: 0, sold: 0, hits: 0 }; c.views += p.views; c.carts += p.cartAdds; c.sold += p.sold; c.hits += p.searchHits; m.set(p.category, c); }
      return [...m.values()].sort((a, b) => b.sold * 5 + b.carts * 2 + b.views + b.hits - (a.sold * 5 + a.carts * 2 + a.views + a.hits));
    }),
  ]);
  const maxC = Math.max(1, ...terms.map((t) => t.count));
  const maxCat = Math.max(1, ...catAgg.map((c) => c.views + c.carts * 2 + c.sold * 5 + c.hits));
  return (
    <>
      <H sub="Every search is counted. Interest score = sold×5 + added to cart×2 + appeared in search + views×0.3">What your users want</H>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <p className="mb-4 font-display font-bold">Top search terms</p>
          {terms.length === 0 ? <p className="text-sm text-muted">No searches yet.</p> : (
            <ol className="space-y-2">{terms.map((t, i) => (
              <li key={t.term} className="text-sm">
                <div className="flex justify-between"><span><b className="text-muted">{i + 1}.</b> {t.term} {t.lastResults === 0 && <span className="rounded bg-berry/10 px-1.5 text-[10px] font-bold text-berry">no results</span>}</span><b>{t.count}</b></div>
                <div className="mt-1 h-1.5 rounded-full bg-cream"><div className="h-full rounded-full bg-volt" style={{ width: `${(t.count / maxC) * 100}%` }} /></div>
              </li>))}
            </ol>
          )}
        </Card>
        <div className="space-y-6">
          <Card>
            <p className="mb-4 font-display font-bold">Interest by category</p>
            <div className="space-y-2">{catAgg.map((c) => { const s = c.views + c.carts * 2 + c.sold * 5 + c.hits; return (
              <div key={c._id} className="text-sm"><div className="flex justify-between"><span className="font-semibold">{catLabel(c._id)}</span><span className="text-xs text-muted">{c.views} views · {c.carts} carts · {c.sold} sold</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-cream"><div className="h-full rounded-full bg-fg" style={{ width: `${(s / maxCat) * 100}%` }} /></div></div>); })}
            </div>
          </Card>
          <Card>
            <p className="mb-1 font-display font-bold">Searched but not found</p>
            <p className="mb-3 text-xs text-muted">Products people want that you don&apos;t sell yet. Import these!</p>
            {zero.length === 0 ? <p className="text-sm text-muted">Nothing yet.</p> : <div className="flex flex-wrap gap-2">{zero.map((z) => <span key={z.term} className="rounded-full bg-berry/10 px-3 py-1 text-xs font-bold text-berry">{z.term} · {z.count}</span>)}</div>}
          </Card>
        </div>
      </div>
      <Card className="mt-6 overflow-x-auto p-0">
        <p className="p-5 pb-2 font-display font-bold">Most interesting products</p>
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-cream text-left text-xs uppercase tracking-wider text-muted"><tr>{["#", "Product", "Views", "Added to cart", "In searches", "Sold", "Score"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">{products.map((p, i) => (
            <tr key={String(p._id)}><td className="px-4 py-2 font-bold text-muted">{i + 1}</td><td className="px-4 py-2"><div className="flex items-center gap-2"><img src={p.images[0]} alt="" className="h-9 w-9 rounded-lg" /><span className="font-semibold">{p.title}</span></div></td>
              <td className="px-4 py-2">{p.views}</td><td className="px-4 py-2">{p.cartAdds}</td><td className="px-4 py-2">{p.searchHits}</td><td className="px-4 py-2">{p.sold}</td><td className="px-4 py-2 font-black text-volt">{Math.round(p.score)}</td></tr>))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

async function Products() {
  const [products, settings, auto] = await Promise.all([Product.find({}).select("-tr").sort({ createdAt: -1 }).limit(500).lean(), getSettings(), Settings.findOne({ key: "global" }).select("cjAutoImport cjAutoImportTarget cjLastAutoImport").lean()]);
  const untranslated = await Product.countDocuments({ active: true, trDone: { $ne: true } });
  const cats = CATEGORIES.map((c) => ({ slug: c.slug, label: catLabel(c.slug) }));
  return (
    <>
      <H sub={`Customer price = supplier cost + margin (global ${settings.marginPct}%, or per-product override), rounded to .99`}>Products ({products.length})</H>
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card><p className="mb-3 font-display font-bold">Import from CJ Dropshipping</p><div className="mb-4"><AutoImportSchedule enabled={auto?.cjAutoImport !== false} target={auto?.cjAutoImportTarget ?? 40} last={auto?.cjLastAutoImport ? JSON.parse(JSON.stringify(auto.cjLastAutoImport)) : null} /></div><AutoImport categories={cats} enabled={cjEnabled()} /></Card>
        <Card><p className="mb-3 font-display font-bold">Translations</p><TranslateButton pending={untranslated} enabled={translateEnabled()} /><p className="mb-3 mt-6 font-display font-bold">Import from AliExpress</p><ImportForm categories={cats} enabled={aliEnabled()} /></Card>
        <Card><p className="mb-3 font-display font-bold">Add product manually (Alibaba link)</p><AddProductForm categories={cats} /></Card>
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-cream text-left text-xs uppercase tracking-wider text-muted"><tr>{["Product", "Category", "Source", "Cost / margin %", "Price", "Profit", "Stock", "Live", "Featured"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">{products.map((p) => (
            <tr key={String(p._id)} className={p.active ? "" : "opacity-50"}>
              <td className="px-4 py-2"><div className="flex items-center gap-2"><img src={p.images[0]} alt="" className="h-9 w-9 rounded-lg" /><a href={`/en/p/${p.slug}`} target="_blank" className="line-clamp-1 max-w-64 font-semibold hover:text-volt">{p.title}</a></div></td>
              <td className="px-4 py-2 text-xs">{catLabel(p.category)}</td>
              <td className="px-4 py-2 text-xs">{p.sourceUrl ? <a href={p.sourceUrl} target="_blank" rel="noreferrer" className="font-bold text-volt underline">{p.source}</a> : p.source}</td>
              <td className="px-4 py-2"><ProductCost id={String(p._id)} cost={p.costPrice} margin={p.marginPct ?? null} /></td>
              <td className="px-4 py-2 font-bold">{$(p.price)}</td>
              <td className="px-4 py-2 font-bold text-ok">{$(p.price - p.costPrice)}</td>
              <td className="px-4 py-2">{p.stock}</td>
              <td className="px-4 py-2"><ProductToggle id={String(p._id)} field="active" value={p.active} /></td>
              <td className="px-4 py-2"><ProductToggle id={String(p._id)} field="featured" value={p.featured} /></td>
            </tr>))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

async function SettingsTab() {
  const s = await getSettings();
  const cjAuto = (await Settings.findOne({ key: "global" }).select("cjAutoOrder").lean())?.cjAutoOrder !== false;
  const checks: [string, boolean, string][] = [
    ["MongoDB Atlas", !!process.env.MONGODB_URI, "MONGODB_URI"],
    ["Google sign-in", providerFlags.google, "AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET"],
    ["Apple (iCloud) sign-in", providerFlags.apple, "AUTH_APPLE_ID, AUTH_APPLE_SECRET"],
    ["Card payments (Stripe)", stripeEnabled(), "STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — until set, checkout runs in TEST mode"],
    ["CJ Dropshipping", cjEnabled(), "CJ_API_KEY — import products, auto-send orders, tracking (+ CRON_SECRET for daily sync)"],
    ["AliExpress import", aliEnabled(), "ALIEXPRESS_APP_KEY, ALIEXPRESS_APP_SECRET, ALIEXPRESS_TRACKING_ID"],
    ["Telegram order alerts", !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID), "TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID"],
    ["Customer emails", !!process.env.RESEND_API_KEY, "RESEND_API_KEY, EMAIL_FROM"],
    ["Custom admin password", !!process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD !== "admin", "ADMIN_LOGIN, ADMIN_PASSWORD"],
  ];
  return (
    <>
      <H>Settings</H>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><p className="mb-4 font-display font-bold">Pricing</p><SettingsForm marginPct={s.marginPct} freeShippingOver={s.freeShippingOver} cjAutoOrder={cjAuto} /></Card>
        <Card>
          <p className="mb-4 font-display font-bold">Integrations</p>
          <ul className="space-y-3">{checks.map(([l, ok, env]) => (
            <li key={l} className="flex gap-3 text-sm">{ok ? <CheckCircle2 size={20} className="shrink-0 text-ok" /> : <XCircle size={20} className="shrink-0 text-berry" />}<div><b>{l}</b><p className="text-xs text-muted">{env}</p></div></li>))}
          </ul>
        </Card>
      </div>
    </>
  );
}
