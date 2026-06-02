import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  addManualArticle,
  addSubstackSource,
  analyzeWritingDNA,
  deleteArticle,
  recommendNextArticle,
  removeSubstackSource,
  scanForThreads,
  setRecommendationStatus,
  setThreadStatus,
  syncSubstack,
} from "@/lib/editorial.functions";
import { sensemake, type SensemakeResult } from "@/lib/diagnose.functions";

export const Route = createFileRoute("/_authenticated/editorial")({
  head: () => ({ meta: [{ title: "Editorial Intelligence — Untangle" }] }),
  component: EditorialPage,
});

const STATUS_COLOR: Record<string, string> = {
  core: "#1A2744",
  recurring: "#1A6FB5",
  emerging: "#C87D0E",
};

function EditorialPage() {
  const qc = useQueryClient();

  const sync = useServerFn(syncSubstack);
  const addSource = useServerFn(addSubstackSource);
  const removeSource = useServerFn(removeSubstackSource);
  const addArticle = useServerFn(addManualArticle);
  const delArticle = useServerFn(deleteArticle);
  const analyze = useServerFn(analyzeWritingDNA);
  const recommend = useServerFn(recommendNextArticle);
  const scan = useServerFn(scanForThreads);
  const recStatus = useServerFn(setRecommendationStatus);
  const threadStatus = useServerFn(setThreadStatus);

  // ---------- queries ----------
  const sources = useQuery({
    queryKey: ["editorial-sources"],
    queryFn: async () => (await supabase.from("substack_sources").select("*").order("created_at")).data ?? [],
  });
  const articles = useQuery({
    queryKey: ["editorial-articles"],
    queryFn: async () =>
      (await supabase
        .from("articles")
        .select("id, title, url, source, published_at, themes, tags, content_text")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(100)).data ?? [],
  });
  const themes = useQuery({
    queryKey: ["editorial-themes"],
    queryFn: async () => (await supabase.from("writing_themes").select("*").order("frequency", { ascending: false })).data ?? [],
  });
  const recs = useQuery({
    queryKey: ["editorial-recs"],
    queryFn: async () =>
      (await supabase
        .from("article_recommendations")
        .select("*")
        .eq("status", "open")
        .order("score", { ascending: false, nullsFirst: false })
        .limit(10)).data ?? [],
  });
  const threads = useQuery({
    queryKey: ["editorial-threads"],
    queryFn: async () =>
      (await supabase.from("unfinished_threads").select("*").eq("status", "open").order("mentions_count", { ascending: false })).data ?? [],
  });

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: ["editorial-sources"] });
    qc.invalidateQueries({ queryKey: ["editorial-articles"] });
    qc.invalidateQueries({ queryKey: ["editorial-themes"] });
    qc.invalidateQueries({ queryKey: ["editorial-recs"] });
    qc.invalidateQueries({ queryKey: ["editorial-threads"] });
  }

  // ---------- mutations ----------
  const mSync = useMutation({ mutationFn: () => sync({}), onSuccess: invalidateAll });
  const mAddSource = useMutation({
    mutationFn: (vars: { feedUrl: string; publicationName?: string }) => addSource({ data: vars }),
    onSuccess: invalidateAll,
  });
  const mRmSource = useMutation({ mutationFn: (id: string) => removeSource({ data: { id } }), onSuccess: invalidateAll });
  const mAddArticle = useMutation({
    mutationFn: (vars: { title: string; content: string; source: "draft" | "note" | "fragment" | "published"; tags?: string[]; url?: string }) =>
      addArticle({ data: vars }),
    onSuccess: invalidateAll,
  });
  const mDelArticle = useMutation({ mutationFn: (id: string) => delArticle({ data: { id } }), onSuccess: invalidateAll });
  const mAnalyze = useMutation({ mutationFn: () => analyze({}), onSuccess: invalidateAll });
  const mRecommend = useMutation({ mutationFn: () => recommend({}), onSuccess: invalidateAll });
  const mScan = useMutation({ mutationFn: () => scan({}), onSuccess: invalidateAll });
  const mRecStatus = useMutation({
    mutationFn: (vars: { id: string; status: "open" | "dismissed" | "drafted" | "published" }) =>
      recStatus({ data: vars }),
    onSuccess: invalidateAll,
  });
  const mThreadStatus = useMutation({
    mutationFn: (vars: { id: string; status: "open" | "dismissed" | "resolved" }) => threadStatus({ data: vars }),
    onSuccess: invalidateAll,
  });

  // ---------- forms ----------
  const [feedUrl, setFeedUrl] = useState("");
  const [draftForm, setDraftForm] = useState({ title: "", content: "", source: "draft" as "draft" | "note" | "fragment", tags: "" });
  const [showAddDraft, setShowAddDraft] = useState(false);

  const articleById = useMemo(() => {
    const m: Record<string, any> = {};
    (articles.data ?? []).forEach((a) => (m[a.id] = a));
    return m;
  }, [articles.data]);

  return (
    <div className="space-y-14">
      {/* HEADER */}
      <div>
        <div className="flex items-baseline gap-3">
          <h2 className="font-serif text-3xl">Editorial Intelligence.</h2>
          <span className="text-[10px] tracking-[3px] uppercase text-muted-foreground">your developmental editor</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Reads your own body of work. Surfaces the themes you keep returning to, the questions you haven't answered yet, and the next article most worth writing — based strictly on what's already in your corpus.
        </p>
      </div>

      {/* SOURCES */}
      <section>
        <SectionTitle>Sources</SectionTitle>
        <div className="space-y-2">
          {(sources.data ?? []).map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 border border-border rounded bg-card text-sm">
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{s.publication_name || s.feed_url}</div>
                <div className="text-xs text-muted-foreground truncate">{s.feed_url}</div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {s.last_synced_at ? `Last synced ${new Date(s.last_synced_at).toLocaleString()}` : "Never synced"}
                </div>
              </div>
              <button onClick={() => mRmSource.mutate(s.id)} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
            </div>
          ))}
          {!sources.data?.length && <div className="text-sm text-muted-foreground italic">No feeds yet.</div>}
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          <input
            value={feedUrl}
            onChange={(e) => setFeedUrl(e.target.value)}
            placeholder="https://yourname.substack.com/feed"
            className="flex-1 min-w-[260px] border border-border rounded px-3 py-2 bg-card font-mono text-sm outline-none focus:border-accent"
          />
          <button
            disabled={!feedUrl.trim() || mAddSource.isPending}
            onClick={() => {
              const url = feedUrl.trim();
              const normalized = url.endsWith("/feed") ? url : url.replace(/\/$/, "") + "/feed";
              mAddSource.mutate({ feedUrl: normalized }, { onSuccess: () => setFeedUrl("") });
            }}
            className="px-4 py-2 bg-navy text-primary-foreground text-[10px] tracking-[2px] uppercase disabled:opacity-50"
          >
            Add feed
          </button>
          <button
            disabled={!sources.data?.length || mSync.isPending}
            onClick={() => mSync.mutate()}
            className="px-4 py-2 border border-border text-[10px] tracking-[2px] uppercase disabled:opacity-50"
          >
            {mSync.isPending ? "Syncing..." : "Sync now"}
          </button>
        </div>
        {mSync.data && (
          <div className="mt-2 text-xs text-muted-foreground">
            Imported {(mSync.data as any).imported} items from {(mSync.data as any).sources} source(s).
          </div>
        )}
      </section>

      {/* MANUAL DRAFTS / NOTES */}
      <section>
        <SectionTitle>Drafts &amp; Notes</SectionTitle>
        <p className="text-xs text-muted-foreground mb-3">
          Substack drafts and Notes aren't available through their API. Paste them here manually so the engine can include them.
        </p>
        {!showAddDraft && (
          <button onClick={() => setShowAddDraft(true)} className="px-4 py-2 bg-navy text-primary-foreground text-[10px] tracking-[2px] uppercase">
            + Paste draft, note, or fragment
          </button>
        )}
        {showAddDraft && (
          <div className="p-5 border border-border rounded bg-card space-y-3">
            <input
              value={draftForm.title}
              onChange={(e) => setDraftForm({ ...draftForm, title: e.target.value })}
              placeholder="Title"
              className="w-full border-b border-border bg-transparent py-2 font-serif text-lg outline-none focus:border-accent"
            />
            <textarea
              value={draftForm.content}
              onChange={(e) => setDraftForm({ ...draftForm, content: e.target.value })}
              rows={10}
              placeholder="Paste the full text..."
              className="w-full border border-border rounded p-3 font-mono text-sm outline-none resize-y focus:border-accent"
            />
            <div className="flex gap-2 flex-wrap items-center">
              <select
                value={draftForm.source}
                onChange={(e) => setDraftForm({ ...draftForm, source: e.target.value as any })}
                className="border border-border rounded px-3 py-2 bg-card text-sm"
              >
                <option value="draft">Draft</option>
                <option value="note">Note</option>
                <option value="fragment">Fragment</option>
              </select>
              <input
                value={draftForm.tags}
                onChange={(e) => setDraftForm({ ...draftForm, tags: e.target.value })}
                placeholder="tags, comma, separated"
                className="flex-1 min-w-[200px] border border-border rounded px-3 py-2 font-mono text-sm outline-none focus:border-accent"
              />
              <button
                disabled={!draftForm.title || !draftForm.content || mAddArticle.isPending}
                onClick={() =>
                  mAddArticle.mutate(
                    {
                      title: draftForm.title,
                      content: draftForm.content,
                      source: draftForm.source,
                      tags: draftForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
                    },
                    {
                      onSuccess: () => {
                        setDraftForm({ title: "", content: "", source: "draft", tags: "" });
                        setShowAddDraft(false);
                      },
                    },
                  )
                }
                className="px-5 py-2 bg-navy text-primary-foreground text-[10px] tracking-[2px] uppercase disabled:opacity-50"
              >
                Save
              </button>
              <button onClick={() => setShowAddDraft(false)} className="text-[10px] tracking-[2px] uppercase text-muted-foreground">
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* WRITING DNA */}
      <section>
        <div className="flex items-baseline justify-between">
          <SectionTitle>Writing DNA</SectionTitle>
          <button
            onClick={() => mAnalyze.mutate()}
            disabled={mAnalyze.isPending || !articles.data?.length}
            className="px-4 py-2 text-[10px] tracking-[2px] uppercase border border-border disabled:opacity-50"
          >
            {mAnalyze.isPending ? "Reading your corpus..." : "Re-analyze"}
          </button>
        </div>
        {!themes.data?.length && (
          <div className="text-sm text-muted-foreground italic">
            No themes detected yet. {articles.data?.length ? "Click Re-analyze." : "Import a feed or paste a draft first."}
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-4">
          {(themes.data ?? []).map((t) => (
            <div
              key={t.id}
              className="px-3 py-2 rounded border bg-card"
              style={{ borderLeft: `4px solid ${STATUS_COLOR[t.status] ?? "#999"}` }}
              title={t.description ?? ""}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-sm">{t.name}</span>
                <span className="text-[9px] tracking-[2px] uppercase text-muted-foreground">×{t.frequency}</span>
                <span className="text-[9px] tracking-[2px] uppercase" style={{ color: STATUS_COLOR[t.status] ?? "#999" }}>{t.status}</span>
              </div>
              {t.description && <div className="text-xs text-muted-foreground mt-1 max-w-xs">{t.description}</div>}
            </div>
          ))}
        </div>
        {mAnalyze.data && (
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            {(mAnalyze.data as any).obsessions?.length > 0 && (
              <div>
                <div className="text-[10px] tracking-[2px] uppercase text-muted-foreground mb-2">Intellectual obsessions</div>
                <ul className="text-sm space-y-1">
                  {(mAnalyze.data as any).obsessions.map((o: string) => <li key={o} className="font-serif italic">— {o}</li>)}
                </ul>
              </div>
            )}
            {(mAnalyze.data as any).questions?.length > 0 && (
              <div>
                <div className="text-[10px] tracking-[2px] uppercase text-muted-foreground mb-2">Questions you keep asking</div>
                <ul className="text-sm space-y-1">
                  {(mAnalyze.data as any).questions.map((q: string) => <li key={q} className="font-serif italic">— {q}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SENSEMAKING CHAIN */}
      <SensemakingChain />


      {/* UNFINISHED THREADS + IDEA DETECTOR */}
      <section>
        <div className="flex items-baseline justify-between">
          <SectionTitle>Topics Worth Exploring</SectionTitle>
          <button
            onClick={() => mScan.mutate()}
            disabled={mScan.isPending}
            className="px-4 py-2 text-[10px] tracking-[2px] uppercase border border-border disabled:opacity-50"
          >
            {mScan.isPending ? "Scanning..." : "Scan for threads"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Pulled from your Brain Dumps, Knowledge Vault, Courtroom entries, and existing articles. Questions and ideas you keep returning to.
        </p>
        {!threads.data?.length && <div className="text-sm text-muted-foreground italic mt-3">Nothing detected yet.</div>}
        <div className="mt-4 grid md:grid-cols-2 gap-3">
          {(threads.data ?? []).map((t) => (
            <div key={t.id} className="p-4 border border-border rounded bg-card">
              <div className="flex items-baseline justify-between gap-2">
                <div className="font-serif text-base">{t.topic}</div>
                <span className="text-[9px] tracking-[2px] uppercase text-muted-foreground">×{t.mentions_count}</span>
              </div>
              {t.question && <div className="text-sm mt-2 italic text-foreground">"{t.question}"</div>}
              {t.evidence && <div className="text-xs text-muted-foreground mt-2">{t.evidence}</div>}
              {t.sources?.length > 0 && (
                <div className="mt-2 flex gap-1 flex-wrap">
                  {t.sources.map((s: string) => <span key={s} className="text-[9px] px-1.5 py-0.5 bg-muted rounded">{s}</span>)}
                </div>
              )}
              <div className="mt-3 flex gap-3 text-[10px] tracking-[2px] uppercase">
                <button onClick={() => mThreadStatus.mutate({ id: t.id, status: "resolved" })} className="text-muted-foreground hover:text-navy">Resolved</button>
                <button onClick={() => mThreadStatus.mutate({ id: t.id, status: "dismissed" })} className="text-muted-foreground hover:text-destructive">Dismiss</button>
              </div>
            </div>
          ))}
        </div>
        {mScan.data && (mScan.data as any).ideas?.length > 0 && (
          <div className="mt-8">
            <div className="text-[10px] tracking-[3px] uppercase text-muted-foreground mb-3">Repeated ideas worth turning into articles</div>
            <ul className="space-y-2">
              {(mScan.data as any).ideas.map((i: any, idx: number) => (
                <li key={idx} className="p-3 border-l-2 border-accent bg-card text-sm">
                  <div className="font-medium">{i.topic} <span className="text-xs text-muted-foreground">×{i.mentions}</span></div>
                  <div className="text-xs text-muted-foreground mt-1">{i.evidence}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* KNOWLEDGE GRAPH */}
      <section>
        <SectionTitle>Knowledge Graph</SectionTitle>
        <p className="text-xs text-muted-foreground mb-3">
          Themes (gold) sit at the center. Articles (navy dots) orbit and connect to the themes they belong to.
        </p>
        <KnowledgeGraph articles={articles.data ?? []} themes={themes.data ?? []} />
      </section>

      {/* RECENT ARTICLES */}
      <section>
        <SectionTitle>Corpus ({articles.data?.length ?? 0} pieces)</SectionTitle>
        <div className="space-y-1.5">
          {(articles.data ?? []).slice(0, 30).map((a) => (
            <div key={a.id} className="flex justify-between items-center gap-3 p-2 group">
              <div className="min-w-0 flex-1">
                <div className="text-sm truncate">
                  {a.url ? <a className="hover:underline" href={a.url} target="_blank" rel="noreferrer">{a.title}</a> : a.title}
                </div>
                <div className="text-[10px] tracking-[2px] uppercase text-muted-foreground">
                  {a.source}{a.published_at ? ` · ${new Date(a.published_at).toLocaleDateString()}` : ""}{a.themes?.length ? ` · ${a.themes.join(", ")}` : ""}
                </div>
              </div>
              <button onClick={() => mDelArticle.mutate(a.id)} className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100">×</button>
            </div>
          ))}
          {!articles.data?.length && <div className="text-sm text-muted-foreground italic">Empty.</div>}
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-serif text-2xl mb-3">{children}</h3>;
}

// ============================================================
// Sensemaking Chain — Observation → Question → Mechanism →
// Your Writing → Research → Book → Better Question → Action
// ============================================================
const SENSEMAKE_EXAMPLES = [
  "I have a million things to do.",
  "I can't focus.",
  "I keep thinking about them.",
  "I don't know where to start.",
  "Something about this isn't sitting right.",
  "I keep avoiding this and I don't know why.",
];

function SensemakingChain() {
  const run = useServerFn(sensemake);
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [result, setResult] = useState<SensemakeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setErr("");
    setResult(null);
    setSubmitted(input.trim());
    try {
      const r = await run({ data: { input: input.trim() } });
      setResult(r);
    } catch (e: any) {
      setErr(e.message ?? "Something went wrong.");
    }
    setLoading(false);
  }

  return (
    <section>
      <div className="flex items-baseline gap-3">
        <SectionTitle>Sensemaking Engine</SectionTitle>
        <span className="text-[10px] tracking-[3px] uppercase text-muted-foreground">
          observation → explanation
        </span>
      </div>
      <p className="text-sm text-muted-foreground max-w-2xl mb-5">
        Enter what you're noticing. The engine builds an intellectual chain — finds the question underneath, names the mechanism, pulls the piece of your own writing that's wrestling with the same idea, and points to the research worth sitting with. Help yourself move from description to explanation.
      </p>

      {!result && (
        <div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            rows={4}
            placeholder="An observation. A friction. A pattern. A question you keep circling."
            className="w-full border border-border rounded-sm p-4 bg-card font-serif text-lg leading-relaxed outline-none resize-none focus:border-foreground transition-colors"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {SENSEMAKE_EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setInput(ex)}
                className="text-xs font-serif italic text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-full transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={submit}
              disabled={loading || !input.trim()}
              className="px-8 py-3 text-[11px] tracking-[3px] uppercase disabled:opacity-40 bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              {loading ? "Thinking…" : "Build the chain"}
            </button>
            <span className="text-[10px] tracking-[2px] uppercase text-muted-foreground">
              ⌘ + Enter
            </span>
          </div>
          {err && <p className="mt-4 text-sm text-red-700">{err}</p>}
        </div>
      )}

      {result && (
        <article className="space-y-14 pt-2 pb-4">
          <ChainStep number="01" label="Observation">
            <blockquote className="pl-5 border-l-2 border-foreground font-serif italic text-2xl text-foreground leading-relaxed">
              {submitted}
            </blockquote>
            <p className="mt-4 font-serif text-muted-foreground">
              {result.observation_echo}
            </p>
          </ChainStep>

          <ChainStep number="02" label="The question underneath">
            <p className="font-serif italic text-3xl text-foreground leading-snug">
              {result.core_question}
            </p>
            <p className="mt-4 font-serif text-foreground/80 leading-relaxed">
              {result.question_context}
            </p>
          </ChainStep>

          <ChainStep number="03" label="What may be happening">
            <p className="font-serif text-xl text-foreground leading-relaxed">
              {result.mechanism.plain}
            </p>
            <p className="mt-5 font-serif text-base text-foreground/80 leading-relaxed">
              {result.mechanism.deeper}
            </p>
            {result.mechanism.citations?.length > 0 && (
              <p className="mt-4 font-mono text-[11px] text-muted-foreground">
                {result.mechanism.citations.join(" · ")}
              </p>
            )}
          </ChainStep>

          {result.article && (
            <ChainStep number="04" label="You've thought about this before">
              <h4 className="font-serif text-2xl text-foreground leading-snug">
                {result.article.url ? (
                  <a href={result.article.url} target="_blank" rel="noreferrer" className="hover:underline">
                    {result.article.title}
                  </a>
                ) : (
                  result.article.title
                )}
              </h4>
              <p className="mt-3 font-serif italic text-muted-foreground">
                The question it explores: {result.article.question_it_explores}
              </p>
              <p className="mt-3 font-serif text-foreground/85 leading-relaxed">
                {result.article.why_relevant}
              </p>
              <p className="mt-3 font-serif text-foreground/85 leading-relaxed">
                {result.article.insight}
              </p>
            </ChainStep>
          )}

          <ChainStep number={result.article ? "05" : "04"} label="Related research">
            <p className="font-serif text-xl text-foreground">{result.study.title}</p>
            <p className="font-serif text-sm text-muted-foreground mt-1">
              {result.study.authors} ({result.study.year})
            </p>
            <p className="mt-3 font-serif text-foreground/85 leading-relaxed">
              {result.study.finding}
            </p>
            <p className="mt-3 font-serif italic text-muted-foreground leading-relaxed">
              {result.study.why_it_deepens}
            </p>
            <p className="mt-3 font-mono text-[11px] text-muted-foreground">
              {result.study.citation}
            </p>
          </ChainStep>

          <ChainStep number={result.article ? "06" : "05"} label="A book to sit with">
            <p className="font-serif text-xl text-foreground">
              <em>{result.book.title}</em> — {result.book.author}
            </p>
            <p className="mt-3 font-serif text-foreground/85 leading-relaxed">{result.book.why}</p>
          </ChainStep>

          <ChainStep number={result.article ? "07" : "06"} label="A better question">
            <p className="font-serif italic text-3xl text-foreground leading-snug">
              {result.better_question}
            </p>
          </ChainStep>

          <ChainStep number={result.article ? "08" : "07"} label="One next step">
            <p className="font-serif text-2xl text-foreground leading-snug">
              {result.action.step}
            </p>
            <p className="mt-4 font-serif italic text-muted-foreground leading-relaxed">
              {result.action.why_this_emerges}
            </p>
          </ChainStep>

          <div className="pt-6 border-t border-border flex gap-3">
            <button
              onClick={() => {
                setResult(null);
                setInput("");
                setSubmitted("");
              }}
              className="px-6 py-2 text-[10px] tracking-[3px] uppercase bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              Again
            </button>
            <button
              onClick={() => setResult(null)}
              className="px-6 py-2 text-[10px] tracking-[3px] uppercase border border-border text-foreground hover:bg-muted transition-colors"
            >
              Refine
            </button>
          </div>
        </article>
      )}
    </section>
  );
}

function ChainStep({
  number,
  label,
  children,
}: {
  number: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-4 mb-5 border-b border-border pb-2">
        <span className="font-mono text-[10px] tracking-[2px] text-muted-foreground">
          {number}
        </span>
        <h4 className="font-serif italic text-foreground text-lg">{label}</h4>
      </div>
      {children}
    </div>
  );
}


function KnowledgeGraph({ articles, themes }: { articles: any[]; themes: any[] }) {
  const W = 720, H = 440;
  const cx = W / 2, cy = H / 2;
  if (!themes.length || !articles.length) {
    return (
      <div className="border border-border rounded bg-card p-8 text-center text-sm text-muted-foreground italic">
        Run Re-analyze and import some articles to see the graph.
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

  // Articles around outside ring
  const articleR = Math.min(200, themeR + 80);
  const articleNodes = articles.slice(0, 60).map((a, i) => {
    const ang = (i / Math.min(60, articles.length)) * Math.PI * 2 - Math.PI / 2;
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
