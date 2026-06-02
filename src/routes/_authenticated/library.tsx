import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  analyzeWritingDNA,
  scanForThreads,
  syncSubstack,
  extractArticleSignals,
} from "@/lib/editorial.functions";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({
    meta: [
      { title: "Library — Untangle" },
      {
        name: "description",
        content:
          "A writer's commonplace book. Articles, themes, recurring questions, knowledge entries — the accumulated thinking.",
      },
    ],
  }),
  component: LibraryPage,
});

const STATUS_COLOR: Record<string, string> = {
  core: "#1A2744",
  recurring: "#1A6FB5",
  emerging: "#C87D0E",
};

function CorpusRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="text-[10px] tracking-[2px] uppercase text-muted-foreground mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] px-2 py-0.5 border border-border rounded-sm bg-card text-foreground/85">
      {children}
    </span>
  );
}



type Tab = "questions" | "themes" | "corpus" | "timeline" | "knowledge" | "graph";

function LibraryPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("questions");
  const [q, setQ] = useState("");

  const sync = useServerFn(syncSubstack);
  const analyze = useServerFn(analyzeWritingDNA);
  const scan = useServerFn(scanForThreads);

  const articles = useQuery({
    queryKey: ["library-articles"],
    queryFn: async () =>
      (await supabase
        .from("articles")
        .select("id, title, url, source, published_at, themes, questions, key_ideas, refs, summary, analyzed_at, content_text, core_argument, tensions, open_loops, recurring_concepts")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(200)).data ?? [],
  });

  const themes = useQuery({
    queryKey: ["library-themes"],
    queryFn: async () =>
      (await supabase.from("writing_themes").select("*").order("frequency", { ascending: false })).data ?? [],
  });
  const threads = useQuery({
    queryKey: ["library-threads"],
    queryFn: async () =>
      (await supabase
        .from("unfinished_threads")
        .select("*")
        .eq("status", "open")
        .order("mentions_count", { ascending: false })).data ?? [],
  });
  const knowledge = useQuery({
    queryKey: ["library-knowledge"],
    queryFn: async () =>
      (await supabase.from("knowledge_entries").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const mSync = useMutation({
    mutationFn: () => sync({}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["library-articles"] }),
  });
  const mAnalyze = useMutation({
    mutationFn: () => analyze({}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["library-themes"] }),
  });
  const mScan = useMutation({
    mutationFn: () => scan({}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["library-threads"] }),
  });
  const extract = useServerFn(extractArticleSignals);
  const mExtract = useMutation({
    mutationFn: () => extract({ data: { limit: 8 } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["library-articles"] }),
  });

  const filteredArticles = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return articles.data ?? [];
    return (articles.data ?? []).filter((a: any) => {
      const refs = a.refs ?? {};
      const refBlob = [refs.books, refs.people, refs.concepts, refs.research]
        .flat()
        .filter(Boolean)
        .join(" ");
      return `${a.title} ${(a.themes || []).join(" ")} ${(a.questions || []).join(" ")} ${(a.key_ideas || []).join(" ")} ${(a.tensions || []).join(" ")} ${(a.recurring_concepts || []).join(" ")} ${(a.open_loops || []).join(" ")} ${a.core_argument ?? ""} ${refBlob} ${a.summary ?? ""} ${a.content_text ?? ""}`
        .toLowerCase()
        .includes(s);

    });
  }, [articles.data, q]);

  const unanalyzedCount = useMemo(
    () => (articles.data ?? []).filter((a: any) => !a.analyzed_at).length,
    [articles.data],
  );

  const filteredKnowledge = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return knowledge.data ?? [];
    return (knowledge.data ?? []).filter((e: any) =>
      `${e.title} ${e.body} ${(e.tags || []).join(" ")}`.toLowerCase().includes(s),
    );
  }, [knowledge.data, q]);

  return (
    <div className="max-w-5xl mx-auto">
      <header className="text-center mb-10">
        <p className="text-[11px] tracking-[3px] uppercase text-muted-foreground mb-3">
          A commonplace book
        </p>
        <h1 className="font-serif text-5xl text-foreground leading-tight">Library</h1>
        <p className="mt-4 font-serif italic text-muted-foreground max-w-xl mx-auto">
          The accumulated thinking. Questions you keep returning to, themes that surface across the corpus, notes that became something else.
        </p>
      </header>

      {/* Tabs */}
      <nav className="flex flex-wrap justify-center gap-x-8 gap-y-2 mb-10 border-b border-border pb-3">
        {(
          [
            { id: "questions", label: "Questions" },
            { id: "themes", label: "Themes" },
            { id: "corpus", label: "Corpus" },
            { id: "timeline", label: "Timeline" },
            { id: "knowledge", label: "Notes" },
            { id: "graph", label: "Idea Graph" },
          ] as { id: Tab; label: string }[]
        ).map((t) => (

          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-[11px] tracking-[2px] uppercase transition-colors ${
              tab === t.id ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Search (articles + knowledge only) */}
      {(tab === "corpus" || tab === "knowledge") && (
        <div className="mb-6">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="w-full border-b border-border bg-transparent py-2 font-serif text-lg outline-none focus:border-foreground"
          />
        </div>
      )}

      {/* === Questions === */}
      {tab === "questions" && (
        <section>
          <div className="flex items-baseline justify-between mb-6">
            <p className="font-serif italic text-muted-foreground">
              The questions your writing keeps returning to.
            </p>
            <button
              onClick={() => mScan.mutate()}
              disabled={mScan.isPending}
              className="text-[10px] tracking-[2px] uppercase border border-border px-3 py-1.5 disabled:opacity-50"
            >
              {mScan.isPending ? "Scanning…" : "Re-scan"}
            </button>
          </div>
          {!threads.data?.length ? (
            <p className="font-serif italic text-muted-foreground">Nothing surfaced yet.</p>
          ) : (
            <div className="space-y-8">
              {(threads.data ?? []).map((t: any) => (
                <div key={t.id} className="border-l-2 border-border pl-5">
                  {t.question ? (
                    <p className="font-serif italic text-2xl text-foreground leading-snug">
                      {t.question.replace(/^"|"$/g, "")}
                    </p>
                  ) : (
                    <p className="font-serif text-xl text-foreground">{t.topic}</p>
                  )}
                  {t.evidence && (
                    <p className="mt-3 font-serif text-foreground/80 leading-relaxed">{t.evidence}</p>
                  )}
                  <p className="mt-3 text-[10px] tracking-[2px] uppercase text-muted-foreground">
                    Surfaced ×{t.mentions_count}
                    {t.sources?.length ? ` · ${t.sources.join(", ")}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* === Themes === */}
      {tab === "themes" && (
        <section>
          <div className="flex items-baseline justify-between mb-6">
            <p className="font-serif italic text-muted-foreground">Recurring ideas across the corpus.</p>
            <button
              onClick={() => mAnalyze.mutate()}
              disabled={mAnalyze.isPending || !articles.data?.length}
              className="text-[10px] tracking-[2px] uppercase border border-border px-3 py-1.5 disabled:opacity-50"
            >
              {mAnalyze.isPending ? "Reading…" : "Re-analyze"}
            </button>
          </div>
          {!themes.data?.length ? (
            <p className="font-serif italic text-muted-foreground">No themes yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(themes.data ?? []).map((t: any) => (
                <div
                  key={t.id}
                  className="px-3 py-2 border bg-card rounded-sm"
                  style={{ borderLeft: `3px solid ${STATUS_COLOR[t.status] ?? "#999"}` }}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-base">{t.name}</span>
                    <span className="text-[9px] tracking-[2px] uppercase text-muted-foreground">×{t.frequency}</span>
                  </div>
                  {t.description && (
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">{t.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* === Corpus === */}
      {tab === "corpus" && (
        <section>
          <div className="flex items-baseline justify-between mb-6 gap-4 flex-wrap">
            <div>
              <p className="font-serif italic text-muted-foreground">
                {articles.data?.length ?? 0} pieces in the archive — {filteredArticles.length} showing.
              </p>
              <p className="text-[10px] tracking-[2px] uppercase text-muted-foreground/70 mt-1">
                {unanalyzedCount > 0
                  ? `${unanalyzedCount} not yet deep-read`
                  : "All pieces have been deep-read"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => mSync.mutate()}
                disabled={mSync.isPending}
                className="text-[10px] tracking-[2px] uppercase border border-border px-3 py-1.5 disabled:opacity-50"
              >
                {mSync.isPending ? "Syncing…" : "Sync Substack"}
              </button>
              <button
                onClick={() => mExtract.mutate()}
                disabled={mExtract.isPending || unanalyzedCount === 0}
                className="text-[10px] tracking-[2px] uppercase border border-foreground px-3 py-1.5 disabled:opacity-40"
                title="Read 8 unanalyzed essays and extract themes, questions, ideas, and references."
              >
                {mExtract.isPending ? "Reading…" : "Deep-read 8"}
              </button>
            </div>
          </div>

          <div className="space-y-10">
            {filteredArticles.map((a: any) => {
              const refs = (a.refs ?? {}) as {
                books?: string[];
                people?: string[];
                concepts?: string[];
                research?: string[];
              };
              const hasDeep =
                !!a.summary ||
                (a.questions?.length ?? 0) > 0 ||
                (a.key_ideas?.length ?? 0) > 0 ||
                (refs.books?.length ?? 0) +
                  (refs.people?.length ?? 0) +
                  (refs.concepts?.length ?? 0) +
                  (refs.research?.length ?? 0) >
                  0;

              // Related articles: other pieces that share a theme.
              const related = (articles.data ?? [])
                .filter(
                  (b: any) =>
                    b.id !== a.id &&
                    (a.themes ?? []).some((t: string) => (b.themes ?? []).includes(t)),
                )
                .slice(0, 4);

              return (
                <article key={a.id} className="border-l-2 border-border pl-5">
                  <header>
                    <h3 className="font-serif text-2xl text-foreground leading-snug">
                      {a.url ? (
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          {a.title}
                        </a>
                      ) : (
                        a.title
                      )}
                    </h3>
                    <p className="mt-1 text-[10px] tracking-[2px] uppercase text-muted-foreground">
                      {a.source}
                      {a.published_at
                        ? ` · ${new Date(a.published_at).toLocaleDateString()}`
                        : ""}
                      {!hasDeep && " · not yet deep-read"}
                    </p>
                  </header>

                  {a.summary && (
                    <p className="mt-4 font-serif text-foreground/85 leading-relaxed italic">
                      {a.summary}
                    </p>
                  )}

                  {a.core_argument && (
                    <div className="mt-4 border-l-2 border-foreground/40 pl-3">
                      <p className="text-[10px] tracking-[2px] uppercase text-muted-foreground mb-1">
                        Core argument
                      </p>
                      <p className="font-serif text-foreground leading-snug">
                        {a.core_argument}
                      </p>
                    </div>
                  )}

                  {(a.tensions?.length ?? 0) > 0 && (
                    <CorpusRow label="Tensions explored">
                      {a.tensions.map((t: string) => (
                        <Chip key={t}>{t}</Chip>
                      ))}
                    </CorpusRow>
                  )}

                  {(a.recurring_concepts?.length ?? 0) > 0 && (
                    <CorpusRow label="Recurring concepts">
                      {a.recurring_concepts.map((c: string) => (
                        <Chip key={c}>{c}</Chip>
                      ))}
                    </CorpusRow>
                  )}

                  {(a.open_loops?.length ?? 0) > 0 && (
                    <CorpusRow label="Left unresolved">
                      <ul className="space-y-1.5">
                        {a.open_loops.map((q: string, i: number) => (
                          <li
                            key={i}
                            className="font-serif italic text-foreground/85 leading-snug"
                          >
                            {q}
                          </li>
                        ))}
                      </ul>
                    </CorpusRow>
                  )}


                  {(a.themes?.length ?? 0) > 0 && (
                    <CorpusRow label="Themes">
                      {a.themes.map((t: string) => (
                        <Chip key={t}>{t}</Chip>
                      ))}
                    </CorpusRow>
                  )}

                  {(a.questions?.length ?? 0) > 0 && (
                    <CorpusRow label="Questions explored">
                      <ul className="space-y-1.5">
                        {a.questions.map((q: string, i: number) => (
                          <li
                            key={i}
                            className="font-serif italic text-foreground/85 leading-snug"
                          >
                            {q}
                          </li>
                        ))}
                      </ul>
                    </CorpusRow>
                  )}

                  {(a.key_ideas?.length ?? 0) > 0 && (
                    <CorpusRow label="Key ideas">
                      <ul className="space-y-1.5 list-none">
                        {a.key_ideas.map((k: string, i: number) => (
                          <li
                            key={i}
                            className="font-serif text-foreground/80 leading-snug before:content-['—'] before:mr-2 before:text-muted-foreground"
                          >
                            {k}
                          </li>
                        ))}
                      </ul>
                    </CorpusRow>
                  )}

                  {(refs.books?.length ?? 0) > 0 && (
                    <CorpusRow label="Related books">
                      {refs.books!.map((b, i) => (
                        <Chip key={i}>{b}</Chip>
                      ))}
                    </CorpusRow>
                  )}
                  {(refs.research?.length ?? 0) > 0 && (
                    <CorpusRow label="Related research">
                      {refs.research!.map((r, i) => (
                        <Chip key={i}>{r}</Chip>
                      ))}
                    </CorpusRow>
                  )}
                  {(refs.concepts?.length ?? 0) > 0 && (
                    <CorpusRow label="Connected concepts">
                      {refs.concepts!.map((c, i) => (
                        <Chip key={i}>{c}</Chip>
                      ))}
                    </CorpusRow>
                  )}
                  {(refs.people?.length ?? 0) > 0 && (
                    <CorpusRow label="People named">
                      {refs.people!.map((p, i) => (
                        <Chip key={i}>{p}</Chip>
                      ))}
                    </CorpusRow>
                  )}

                  {related.length > 0 && (
                    <CorpusRow label="Related articles">
                      <ul className="space-y-1">
                        {related.map((r: any) => (
                          <li key={r.id} className="font-serif text-sm">
                            {r.url ? (
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-foreground/80 hover:underline"
                              >
                                → {r.title}
                              </a>
                            ) : (
                              <span className="text-foreground/80">→ {r.title}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </CorpusRow>
                  )}
                </article>
              );
            })}
            {!filteredArticles.length && (
              <p className="font-serif italic text-muted-foreground py-6">
                Nothing in the archive yet. Sync your Substack to begin.
              </p>
            )}
          </div>
        </section>
      )}


      {/* === Knowledge entries (formerly Vault) === */}
      {tab === "knowledge" && (
        <section>
          <p className="font-serif italic text-muted-foreground mb-6">
            Notes, research, ideas, lessons, references. Add or manage them in{" "}
            <Link to="/vault" className="underline hover:text-foreground">the vault</Link>.
          </p>
          <div className="space-y-6">
            {filteredKnowledge.map((e: any) => (
              <article key={e.id} className="border-l-2 border-border pl-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-serif text-lg text-foreground">{e.title}</h3>
                  <span className="text-[9px] tracking-[2px] uppercase text-muted-foreground">
                    {e.category}
                  </span>
                </div>
                <p className="mt-2 font-serif text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {e.body}
                </p>
                {e.tags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {e.tags.map((t: string) => (
                      <span key={t} className="text-[9px] px-2 py-0.5 border border-border rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
            {!filteredKnowledge.length && (
              <p className="font-serif italic text-muted-foreground">Empty.</p>
            )}
          </div>
        </section>
      )}

      {/* === Knowledge Graph === */}
      {tab === "graph" && (
        <section>
          <p className="font-serif italic text-muted-foreground mb-6">
            Themes (gold) at the center. Articles (navy) orbit and connect to the themes they belong to.
          </p>
          <KnowledgeGraph articles={articles.data ?? []} themes={themes.data ?? []} />
        </section>
      )}
    </div>
  );
}

function KnowledgeGraph({ articles, themes }: { articles: any[]; themes: any[] }) {
  const W = 720, H = 440;
  const cx = W / 2, cy = H / 2;
  if (!themes.length || !articles.length) {
    return (
      <div className="border border-border rounded bg-card p-8 text-center text-sm text-muted-foreground italic">
        Add articles and run Re-analyze on Themes to see the graph.
      </div>
    );
  }
  const themeR = Math.min(160, 30 + themes.length * 12);
  const themeNodes = themes.map((t, i) => {
    const a = (i / themes.length) * Math.PI * 2 - Math.PI / 2;
    return { ...t, x: cx + Math.cos(a) * themeR, y: cy + Math.sin(a) * themeR };
  });
  const themePos: Record<string, { x: number; y: number }> = {};
  themeNodes.forEach((t) => (themePos[t.name.toLowerCase()] = { x: t.x, y: t.y }));

  const articleR = Math.min(200, themeR + 80);
  const articleNodes = articles.slice(0, 80).map((a, i) => {
    const ang = (i / Math.min(80, articles.length)) * Math.PI * 2 - Math.PI / 2;
    return { ...a, x: cx + Math.cos(ang) * articleR, y: cy + Math.sin(ang) * articleR };
  });

  const links: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (const a of articleNodes) {
    for (const tn of a.themes || []) {
      const p = themePos[String(tn).toLowerCase()];
      if (p) links.push({ x1: a.x, y1: a.y, x2: p.x, y2: p.y });
    }
  }

  return (
    <div className="border border-border rounded bg-card overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
        {links.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#C87D0E" strokeOpacity={0.22} strokeWidth={1} />
        ))}
        {articleNodes.map((a) => (
          <g key={a.id}>
            <circle cx={a.x} cy={a.y} r={4} fill="#1A2744" />
            <title>{a.title}</title>
          </g>
        ))}
        {themeNodes.map((t) => {
          const r = 10 + Math.min(20, t.frequency * 2);
          return (
            <g key={t.id}>
              <circle cx={t.x} cy={t.y} r={r} fill="#E8A838" fillOpacity={0.25} stroke="#C87D0E" strokeWidth={1.5} />
              <text x={t.x} y={t.y + r + 12} textAnchor="middle" fontSize={11} fontFamily="serif" fill="#1A2744">
                {t.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
