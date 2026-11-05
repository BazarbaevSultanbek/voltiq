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
    body: JSON.stringify({ from: process.env.EMAIL_FROM || "VOLTIQ <orders@resend.dev>", to, subject, html }),
  }).catch(() => {});
}
