import { createFileRoute, Outlet, Link, redirect, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import signatureAsset from "@/assets/signature.jpg.asset.json";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthLayout,
});

type Tab = { id: string; label: string; to: string };

const TABS: Tab[] = [
  { id: "untangle", label: "Untangle", to: "/untangle" },
  { id: "library", label: "Library", to: "/library" },
  { id: "essays", label: "Essays", to: "/essays" },
  { id: "colophon", label: "Colophon", to: "/colophon" },
];

function AuthLayout() {
  const router = useRouter();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b border-border bg-background">
        <div className="max-w-6xl mx-auto px-6 pt-8 pb-0">
          <div className="flex items-center justify-between">
            <div className="w-24" />
            <Link to="/untangle" className="block text-center group">
              <img
                src={signatureAsset.url}
                alt="Signature"
                className="block h-12 w-auto mx-auto"
                style={{ mixBlendMode: "multiply" }}
              />

            </Link>
            <div className="w-24 flex justify-end">
              {email && (
                <button
                  onClick={signOut}
                  className="text-[11px] tracking-[2px] uppercase text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign out
                </button>
              )}
            </div>
          </div>
          <nav className="flex justify-center gap-8 mt-6">
            {TABS.map((t) => {
              const active = path.startsWith(t.to);
              return (
                <Link
                  key={t.id}
                  to={t.to}
                  className={`relative pb-3 text-[13px] font-medium tracking-tight transition-colors ${
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                  {active && (
                    <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-foreground" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-12 pb-24">
        <Outlet />
      </main>
    </div>
  );
}

