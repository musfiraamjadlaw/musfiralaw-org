import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Untangle" },
      { name: "description", content: "Sign in to Untangle — a place to investigate what isn't making sense and move from observation to understanding." },
      { property: "og:title", content: "Sign in — Untangle" },
      { property: "og:description", content: "Access your Whiteboard, Library, and Activation Framework." },
      { property: "og:url", content: "/login" },
    ],
    links: [{ rel: "canonical", href: "/login" }],
  }),
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
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <YarnBall />
          <h1 className="font-serif text-2xl text-navy mt-4">Untangled by Musfira</h1>
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
    </main>
  );
}

function YarnBall() {
  // A tight spiral "ball" with a single strand trailing off, continuously unravelling.
  return (
    <svg
      viewBox="0 0 200 140"
      width="120"
      height="84"
      className="mx-auto block"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="yarnShade" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="oklch(0.78 0.13 75)" />
          <stop offset="100%" stopColor="oklch(0.62 0.13 75)" />
        </radialGradient>
      </defs>

      {/* Ball body */}
      <g transform="translate(70 78)">
        <circle r="32" fill="url(#yarnShade)" />
        {/* Spiral wraps */}
        <g
          fill="none"
          stroke="oklch(0.32 0.05 265 / 0.55)"
          strokeWidth="1"
          strokeLinecap="round"
        >
          <ellipse cx="0" cy="0" rx="30" ry="10" transform="rotate(-22)" />
          <ellipse cx="0" cy="0" rx="30" ry="10" transform="rotate(18)" />
          <ellipse cx="0" cy="0" rx="30" ry="10" transform="rotate(58)" />
          <ellipse cx="0" cy="0" rx="28" ry="6" transform="rotate(-50)" />
          <ellipse cx="0" cy="0" rx="26" ry="14" transform="rotate(80)" />
          <ellipse cx="0" cy="0" rx="24" ry="8" transform="rotate(-80)" />
        </g>
        {/* Slow rotation of the ball itself */}
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0"
          to="360"
          dur="18s"
          repeatCount="indefinite"
          additive="sum"
        />
      </g>

      {/* Unravelling thread */}
      <path
        d="M 102 78
           C 118 78, 130 64, 140 70
           S 158 96, 168 88
           S 188 70, 196 80"
        fill="none"
        stroke="oklch(0.62 0.13 75)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="180"
        strokeDashoffset="180"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="180; 0; 0; 180"
          keyTimes="0; 0.55; 0.85; 1"
          dur="5s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}
