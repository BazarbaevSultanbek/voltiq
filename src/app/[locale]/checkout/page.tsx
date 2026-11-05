import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { stripeEnabled } from "@/lib/stripe";
import { providerFlags } from "@/auth";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const { freeShippingOver } = await getSettings();
  return (
    <CheckoutClient
      freeOver={freeShippingOver}
      stripePk={stripeEnabled() ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY! : null}
      providers={providerFlags}
    />
  );
}
