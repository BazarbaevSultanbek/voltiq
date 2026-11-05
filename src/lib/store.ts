"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = { id: string; slug: string; title: string; image: string; price: number; color: string; qty: number; compareAt?: number };

type CartState = {
  items: CartItem[];
  bump: number;
  add: (i: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (id: string, color: string, qty: number) => void;
  remove: (id: string, color: string) => CartItem | undefined;
  restore: (i: CartItem) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      bump: 0,
      add: (i, qty = 1) =>
        set((s) => {
          const ex = s.items.find((x) => x.id === i.id && x.color === i.color);
          const items = ex
            ? s.items.map((x) => (x === ex ? { ...x, qty: Math.min(20, x.qty + qty) } : x))
            : [...s.items, { ...i, qty }];
          return { items, bump: s.bump + 1 };
        }),
      setQty: (id, color, qty) => set((s) => ({ items: s.items.map((x) => (x.id === id && x.color === color ? { ...x, qty: Math.max(1, Math.min(20, qty)) } : x)) })),
      remove: (id, color) => {
        const it = get().items.find((x) => x.id === id && x.color === color);
        set((s) => ({ items: s.items.filter((x) => !(x.id === id && x.color === color)) }));
        return it;
      },
      restore: (i) => set((s) => ({ items: [...s.items, i] })),
      clear: () => set({ items: [] }),
    }),
    { name: "vq-cart", partialize: (s) => ({ items: s.items }) },
  ),
);

export type Place = { country: string; city: string; region?: string; postal?: string; line1?: string };
type LocState = { place: Place | null; asked: boolean; open: boolean; set: (p: Place) => void; setOpen: (v: boolean) => void };

export const useLocation = create<LocState>()(
  persist(
    (set) => ({
      place: null, asked: false, open: false,
      set: (place) => set({ place, asked: true, open: false }),
      setOpen: (open) => set((s) => ({ open, asked: s.asked || !open })),
    }),
    { name: "vq-location", partialize: (s) => ({ place: s.place, asked: s.asked }) },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((s, i) => s + i.qty, 0);
export const cartSubtotal = (items: CartItem[]) => Math.round(items.reduce((s, i) => s + i.qty * i.price, 0) * 100) / 100;
