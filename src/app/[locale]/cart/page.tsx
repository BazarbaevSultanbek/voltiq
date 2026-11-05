import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { CartClient } from "@/components/CartClient";

export const metadata: Metadata = { title: "Cart", robots: { index: false } };

export default async function CartPage() {
  const { freeShippingOver } = await getSettings();
  return <CartClient freeOver={freeShippingOver} />;
}
