import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Untangle" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dump", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dump` },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      const { data } = await supabase.auth.getUser();
      if (data.user) navigate({ to: "/dump", replace: true });
    } catch (e: any) {
      setErr(e.message ?? "Something went wrong");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl text-navy">Untangle by Musfira</h1>
          <p className="mt-3 font-serif italic text-sm text-muted-foreground">
            Find the pattern. Take the next step. Make it happen.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4 bg-card border border-border p-8 rounded">
          <div>
            <label className="block text-[10px] tracking-[2px] uppercase text-muted-foreground mb-2">Email</label>
            <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
              className="w-full border-b border-border bg-transparent py-2 font-mono text-sm outline-none focus:border-accent" />
          </div>
          <div>
            <label className="block text-[10px] tracking-[2px] uppercase text-muted-foreground mb-2">Password</label>
            <input type="password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)}
              className="w-full border-b border-border bg-transparent py-2 font-mono text-sm outline-none focus:border-accent" />
          </div>
          {err && <div className="text-xs text-destructive">{err}</div>}
          <button disabled={loading} className="w-full bg-navy text-primary-foreground py-3 text-[10px] tracking-[3px] uppercase mt-4 disabled:opacity-50">
            {loading ? "..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
          <button type="button" onClick={()=>setMode(m=>m==="signin"?"signup":"signin")}
            className="w-full text-[10px] tracking-[2px] uppercase text-muted-foreground hover:text-navy">
            {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
