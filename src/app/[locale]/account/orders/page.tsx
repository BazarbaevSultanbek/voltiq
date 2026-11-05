import { redirect } from "next/navigation";
import { db, plain } from "@/lib/db";
import { Order } from "@/models/Order";
import { currentUserId } from "@/lib/session";
import { OrdersClient } from "@/components/account/OrdersClient";
import type { OrderView } from "@/components/SuccessClient";

export const metadata = { title: "My orders", robots: { index: false } };

export default async function OrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const uid = await currentUserId();
  if (!uid) redirect(`/${locale}/login?callbackUrl=/${locale}/account/orders`);
  await db();
  const orders = await Order.find({ user: uid, status: { $ne: "pending_payment" } }).sort({ createdAt: -1 }).lean();
  return <OrdersClient orders={plain<OrderView[]>(orders)} />;
}
