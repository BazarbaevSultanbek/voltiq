import { notFound, redirect } from "next/navigation";
import { db, plain } from "@/lib/db";
import { Order } from "@/models/Order";
import { currentUserId } from "@/lib/session";
import { SuccessClient, type OrderView } from "@/components/SuccessClient";

export const metadata = { title: "Order confirmed", robots: { index: false } };

export default async function Success({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id, locale } = await params;
  const uid = await currentUserId();
  if (!uid) redirect(`/${locale}/login`);
  if (!/^[a-f0-9]{24}$/.test(id)) notFound();
  await db();
  const o = await Order.findOne({ _id: id, user: uid }).lean();
  if (!o) notFound();
  return <SuccessClient o={plain<OrderView>(o)} />;
}
