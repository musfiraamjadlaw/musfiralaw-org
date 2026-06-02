import { createFileRoute, Outlet, Link, redirect, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  { id: "diagnose", label: "Diagnose", to: "/diagnose" },
  { id: "start", label: "Act", to: "/start" },
  { id: "courtroom", label: "Think", to: "/courtroom" },
  { id: "vault", label: "Learn", to: "/vault" },
  { id: "editorial", label: "Write", to: "/editorial" },
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
    <div className="min-h-screen bg-background text-navy font-sans">
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-7 pt-5">
          <div className="flex items-baseline justify-between mb-4">
            <div className="flex items-baseline gap-3">
              <h1 className="font-serif text-xl font-semibold">Cognitive OS</h1>
              <span className="text-[10px] tracking-[3px] uppercase text-muted-foreground">
                Attention · Time · Knowledge · Decisions
              </span>
            </div>
            <button onClick={signOut} className="text-[10px] tracking-[2px] uppercase text-muted-foreground hover:text-navy">
              {email ? "Sign out" : ""}
            </button>
          </div>
          <nav className="flex flex-wrap items-end gap-x-6 gap-y-2 pb-1">
            {GROUPS.map((g) => (
              <div key={g.label} className="flex flex-col">
                <span className="text-[9px] tracking-[2.5px] uppercase text-muted-foreground/70 mb-1">
                  {g.label}
                </span>
                <div className="flex gap-1">
                  {g.tabs.map((t) => {
                    const active = path.startsWith(t.to);
                    return (
                      <Link
                        key={t.id}
                        to={t.to}
                        className={`px-3 py-2 text-[10px] tracking-[2.5px] uppercase whitespace-nowrap border-b-2 transition-colors ${
                          active
                            ? "border-accent text-navy font-medium"
                            : "border-transparent text-muted-foreground hover:text-navy"
                        }`}
                      >
                        {t.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-7 py-12 pb-24">
        <Outlet />
      </main>
    </div>
  );
}
