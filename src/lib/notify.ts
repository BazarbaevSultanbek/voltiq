import "server-only";
import { Notification } from "@/models/Notification";

export async function notifyUser(user: unknown, key: string, vars: Record<string, unknown> = {}, link?: string) {
  await Notification.create({ user: user as never, key, vars, link });
}

/** Optional: ping the store owner on Telegram when an order comes in. */
export async function notifyOwner(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  const tasks: Promise<unknown>[] = [];
  if (token && chat) {
    tasks.push(fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true }),
    }));
  }
  if (process.env.ORDER_WEBHOOK_URL) {
    tasks.push(fetch(process.env.ORDER_WEBHOOK_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) }));
  }
  await Promise.allSettled(tasks);
}

/** Optional: email the customer via Resend. */
export async function emailCustomer(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || "KAUP <orders@resend.dev>", to, subject, html }),
  }).catch(() => {});
}

const STATUS_TEXT: Record<string, string> = {
  paid: "has been accepted", processing: "is being prepared", shipped: "has been shipped",
  delivered: "has been delivered", cancelled: "has been cancelled",
};
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Email the customer when their order status changes (only sends if an email service is configured). */
export async function emailOrderStatus(o: { email?: string | null; number?: string | null; status?: string | null; supplier?: { trackNumber?: string | null } | null }) {
  if (!o.email || !o.number || !o.status || !STATUS_TEXT[o.status]) return;
  const site = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
  const track = o.supplier?.trackNumber ? `<p>Tracking number: <b>${esc(o.supplier.trackNumber)}</b></p>` : "";
  await emailCustomer(o.email, `Order ${o.number} ${STATUS_TEXT[o.status]}`,
    `<h2>Your order ${esc(o.number)} ${STATUS_TEXT[o.status]}.</h2>${track}${site ? `<p><a href="${site}/en/account/orders">View your order</a></p>` : ""}<p>— KAUP</p>`);
}
