import "server-only";
import Stripe from "stripe";

export const stripeEnabled = () => !!process.env.STRIPE_SECRET_KEY && !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
let _s: Stripe | null = null;
export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY missing");
  _s ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return _s;
}
