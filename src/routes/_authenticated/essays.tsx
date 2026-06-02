import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  addManualArticle,
  deleteArticle,
  recommendNextArticle,
  setRecommendationStatus,
} from "@/lib/editorial.functions";

export const Route = createFileRoute("/_authenticated/essays")({
  head: () => ({
    meta: [
      { title: "Essays — Untangle" },
      {
        name: "description",
        content:
          "Drafts, ideas, and editorial intelligence. The questions you keep trying to figure out, surfaced as the essays worth writing next.",
      },
    ],
  }),
  component: EssaysPage,
});

function EssaysPage() {
  const qc = useQueryClient();
  const addArticle = useServerFn(addManualArticle);
  const delArticle = useServerFn(deleteArticle);
  const recommend = useServerFn(recommendNextArticle);
  const recStatus = useServerFn(setRecommendationStatus);

  const drafts = useQuery({
    queryKey: ["essays-drafts"],
    queryFn: async () =>
      (await supabase
        .from("articles")
        .select("id, title, url, source, published_at, themes, content_text")
        .in("source", ["draft", "note", "fragment"])
        .order("created_at", { ascending: false })).data ?? [],
  });
  const articles = useQuery({
    queryKey: ["essays-corpus-light"],
    queryFn: async () =>
      (await supabase
        .from("articles")
        .select("id, title")
        .order("published_at", { ascending: false })
        .limit(200)).data ?? [],
  });
  const recs = useQuery({
    queryKey: ["essays-recs"],
    queryFn: async () =>
      (await supabase
        .from("article_recommendations")
        .select("*")
        .eq("status", "open")
        .order("score", { ascending: false, nullsFirst: false })
        .limit(10)).data ?? [],
  });

  const mAddArticle = useMutation({
    mutationFn: (vars: { title: string; content: string; source: "draft" | "note" | "fragment"; tags?: string[] }) =>
      addArticle({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["essays-drafts"] }),
  });
  const mDelArticle = useMutation({
    mutationFn: (id: string) => delArticle({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["essays-drafts"] }),
  });
  const mRecommend = useMutation({
    mutationFn: () => recommend({}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["essays-recs"] }),
  });
  const mRecStatus = useMutation({
    mutationFn: (vars: { id: string; status: "open" | "dismissed" | "drafted" | "published" }) =>
      recStatus({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["essays-recs"] }),
  });

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", source: "draft" as "draft" | "note" | "fragment", tags: "" });

  const articleById: Record<string, any> = {};
  (articles.data ?? []).forEach((a: any) => (articleById[a.id] = a));

  return (
    <div className="max-w-4xl mx-auto">
      <header className="text-center mb-12">
        <p className="text-[11px] tracking-[3px] uppercase text-muted-foreground mb-3">
          Writing workspace
        </p>
        <h1 className="font-serif text-5xl text-foreground leading-tight">Essays</h1>
        <p className="mt-4 font-serif italic text-muted-foreground max-w-xl mx-auto">
          Drafts in progress. Questions worth pursuing. The next thing worth writing — surfaced from what you keep trying to figure out.
        </p>
      </header>

      {/* === DEVELOPMENTAL EDITOR === */}
      <section className="mb-16">
        <div className="flex items-baseline justify-between mb-2 border-b border-border pb-3">
          <h2 className="font-serif italic text-2xl text-foreground">What I'm Still Trying to Understand</h2>
          <button
            onClick={() => mRecommend.mutate()}
            disabled={mRecommend.isPending}
            className="text-[10px] tracking-[2px] uppercase border border-border px-3 py-1.5 disabled:opacity-50"
          >
            {mRecommend.isPending ? "Reading the corpus…" : "Read my work"}
          </button>
        </div>
        <p className="mt-3 mb-6 font-serif italic text-muted-foreground">
          A developmental editor reading only your published essays — surfacing the questions you keep circling, the tensions you haven't resolved, and the arguments you've gestured at but not fully made. Not topics. Not tasks. Questions.
        </p>

        {!recs.data?.length && (
          <p className="font-serif italic text-muted-foreground">
            Nothing surfaced yet. Run "Read my work" once your Substack is synced.
          </p>
        )}

        <div className="space-y-14">
          {(recs.data ?? []).map((r: any) => (
            <article key={r.id} className="border-l-2 border-foreground pl-6">
              <p className="text-[10px] tracking-[2px] uppercase text-muted-foreground mb-2">Question</p>
              <h3 className="font-serif italic text-2xl text-foreground leading-snug">
                {r.question ?? r.title}
              </h3>

              {r.rationale && (
                <div className="mt-6">
                  <p className="text-[10px] tracking-[2px] uppercase text-muted-foreground mb-2">Why it keeps appearing</p>
                  <p className="font-serif text-foreground/85 leading-relaxed">{r.rationale}</p>
                </div>
              )}

              {r.gap && (
                <div className="mt-5">
                  <p className="text-[10px] tracking-[2px] uppercase text-muted-foreground mb-2">What's missing</p>
                  <p className="font-serif text-foreground/85 leading-relaxed">{r.gap}</p>
                </div>
              )}

              {r.connects_to?.length > 0 && (
                <div className="mt-5">
                  <p className="text-[10px] tracking-[2px] uppercase text-muted-foreground mb-2">Related essays</p>
                  <ul className="space-y-1 font-serif text-foreground/85">
                    {r.connects_to.map((id: string) => {
                      const a = articleById[id];
                      return a ? <li key={id}>— {a.title}</li> : null;
                    })}
                  </ul>
                </div>
              )}

              {r.suggested_essay && (
                <div className="mt-5">
                  <p className="text-[10px] tracking-[2px] uppercase text-muted-foreground mb-2">Suggested essay</p>
                  <p className="font-serif italic text-foreground/90 leading-relaxed">{r.suggested_essay}</p>
                </div>
              )}

              <div className="mt-6 flex gap-5 text-[10px] tracking-[2px] uppercase">
                <button onClick={() => mRecStatus.mutate({ id: r.id, status: "drafted" })} className="text-muted-foreground hover:text-foreground">
                  Drafting
                </button>
                <button onClick={() => mRecStatus.mutate({ id: r.id, status: "published" })} className="text-muted-foreground hover:text-foreground">
                  Answered
                </button>
                <button onClick={() => mRecStatus.mutate({ id: r.id, status: "dismissed" })} className="text-muted-foreground hover:text-destructive">
                  Not this one
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* === DRAFTS === */}
      <section>
        <div className="flex items-baseline justify-between mb-2 border-b border-border pb-3">
          <h2 className="font-serif italic text-2xl text-foreground">Drafts &amp; notes</h2>
          {!showAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className="text-[10px] tracking-[2px] uppercase border border-border px-3 py-1.5"
            >
              + Add
            </button>
          )}
        </div>
        <p className="mt-3 mb-6 font-serif italic text-muted-foreground">
          What's in progress. Paste drafts and fragments — they feed the corpus and the recommendations.
        </p>

        {showAdd && (
          <div className="p-5 border border-border rounded-sm bg-card space-y-3 mb-8">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Title"
              className="w-full border-b border-border bg-transparent py-2 font-serif text-lg outline-none focus:border-foreground"
            />
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={10}
              placeholder="Paste the text…"
              className="w-full border border-border rounded p-3 font-serif text-base outline-none resize-y focus:border-foreground"
            />
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value as any })}
                className="border border-border rounded px-3 py-2 bg-card text-sm"
              >
                <option value="draft">Draft</option>
                <option value="note">Note</option>
                <option value="fragment">Fragment</option>
              </select>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="tags, comma, separated"
                className="flex-1 min-w-[200px] border border-border rounded px-3 py-2 font-mono text-sm outline-none focus:border-foreground"
              />
              <button
                disabled={!form.title || !form.content || mAddArticle.isPending}
                onClick={() =>
                  mAddArticle.mutate(
                    {
                      title: form.title,
                      content: form.content,
                      source: form.source,
                      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
                    },
                    {
                      onSuccess: () => {
                        setForm({ title: "", content: "", source: "draft", tags: "" });
                        setShowAdd(false);
                      },
                    },
                  )
                }
                className="px-5 py-2 bg-foreground text-background text-[10px] tracking-[2px] uppercase disabled:opacity-50"
              >
                Save
              </button>
              <button onClick={() => setShowAdd(false)} className="text-[10px] tracking-[2px] uppercase text-muted-foreground">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-border">
          {(drafts.data ?? []).map((d: any) => (
            <article key={d.id} className="py-4 flex items-baseline justify-between gap-3 group">
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-lg text-foreground truncate">{d.title}</h3>
                <p className="text-[10px] tracking-[2px] uppercase text-muted-foreground">
                  {d.source}
                  {d.themes?.length ? ` · ${d.themes.join(", ")}` : ""}
                </p>
              </div>
              <button
                onClick={() => mDelArticle.mutate(d.id)}
                className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
              >
                Delete
              </button>
            </article>
          ))}
          {!drafts.data?.length && (
            <p className="font-serif italic text-muted-foreground py-6">No drafts yet.</p>
          )}
        </div>
      </section>

      <p className="mt-16 text-center font-serif italic text-muted-foreground">
        The goal is not more content. The goal is to understand your own body of work.
      </p>
    </div>
  );
}
