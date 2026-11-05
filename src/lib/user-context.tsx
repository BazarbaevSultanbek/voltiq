"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Me = {
  _id: string; email: string; name: string; username?: string; image?: string; phone?: string; providers: string[];
  hasPassword: boolean; createdAt: string;
  addresses: { _id: string; fullName: string; phone: string; country: string; region?: string; city: string; line1: string; line2?: string; postal?: string; isDefault?: boolean }[];
};

const Ctx = createContext<{ me: Me | null; loading: boolean; refresh: () => Promise<void> }>({ me: null, loading: true, refresh: async () => {} });

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/me", { cache: "no-store" });
      const d = await r.json();
      setMe(d.user);
    } catch { setMe(null); } finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return <Ctx.Provider value={{ me, loading, refresh }}>{children}</Ctx.Provider>;
}
export const useMe = () => useContext(Ctx);
