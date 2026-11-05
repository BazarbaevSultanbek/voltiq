"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Logo } from "../Logo";

export function AdminLogin() {
  const router = useRouter();
  const [f, setF] = useState({ login: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid min-h-screen place-items-center bg-night p-4 grain relative">
      <div className="absolute left-1/3 top-1/4 h-80 w-80 rounded-full bg-volt/30 blur-3xl" />
      <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-sm rounded-[2rem] bg-paper p-8 shadow-2xl"
        onSubmit={async (e) => {
          e.preventDefault(); setBusy(true); setErr("");
          const r = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
          setBusy(false);
          if (r.ok) router.refresh(); else setErr(r.status === 429 ? "Too many attempts. Try again in 10 minutes." : "Wrong login or password.");
        }}>
        <Logo />
        <h1 className="mt-6 flex items-center gap-2 font-display text-2xl font-black"><ShieldCheck className="text-volt" />Admin</h1>
        <div className="mt-6 space-y-4">
          <div><label className="label" htmlFor="al">Login</label><input id="al" className="input" autoComplete="username" value={f.login} onChange={(e) => setF({ ...f, login: e.target.value })} /></div>
          <div><label className="label" htmlFor="ap">Password</label><input id="ap" type="password" className="input" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        </div>
        {err && <p className="mt-3 text-sm font-bold text-berry">{err}</p>}
        <button className="btn btn-primary mt-6 w-full" disabled={busy}>{busy && <Loader2 size={16} className="animate-spin" />}Sign in</button>
      </motion.form>
    </div>
  );
}
