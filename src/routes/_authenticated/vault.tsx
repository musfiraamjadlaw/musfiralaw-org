import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/vault")({
  head: () => ({ meta: [{ title: "Knowledge Vault — Untangle" }] }),
  component: VaultPage,
});

const CATEGORIES = ["note", "research", "idea", "lesson", "reference"] as const;
type Cat = typeof CATEGORIES[number];

const CAT_LABEL: Record<Cat, string> = {
  note: "Notes",
  research: "Research",
  idea: "Ideas",
  lesson: "Lessons learned",
  reference: "Reference material",
};

function VaultPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Cat | "all">("all");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", category: "note" as Cat, tags: "" });
  const qc = useQueryClient();

  const { data: entries = [] } = useQuery({
    queryKey: ["knowledge"],
    queryFn: async () => {
      const { data, error } = await supabase.from("knowledge_entries").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("knowledge_entries").insert({
        user_id: u.user.id,
        title: form.title,
        body: form.body,
        category: form.category,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["knowledge"] });
      setForm({ title: "", body: "", category: "note", tags: "" });
      setAdding(false);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("knowledge_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["knowledge"] }),
  });

  const filtered = entries.filter((e: any) => {
    if (cat !== "all" && e.category !== cat) return false;
    if (!q) return true;
    const hay = `${e.title} ${e.body} ${(e.tags || []).join(" ")}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <h2 className="font-serif text-3xl">Knowledge Vault.</h2>
        <span className="text-[10px] tracking-[3px] uppercase text-muted-foreground">your second brain</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Notes, research, ideas, lessons, references. Searchable forever.</p>

      <div className="mt-6 flex flex-wrap gap-2 items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search…"
          className="flex-1 min-w-[200px] border border-border rounded px-3 py-2 bg-card font-mono text-sm outline-none focus:border-accent" />
        <select value={cat} onChange={(e) => setCat(e.target.value as any)}
          className="border border-border rounded px-3 py-2 bg-card text-sm">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
        </select>
        <button onClick={() => setAdding((a) => !a)} className="px-4 py-2 bg-navy text-primary-foreground text-[10px] tracking-[2px] uppercase">
          {adding ? "Close" : "+ New"}
        </button>
      </div>

      {adding && (
        <div className="mt-4 p-5 border border-border rounded bg-card space-y-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title"
            className="w-full border-b border-border bg-transparent py-2 font-serif text-lg outline-none focus:border-accent" />
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={5} placeholder="Body…"
            className="w-full border border-border rounded p-3 font-mono text-sm outline-none resize-none focus:border-accent" />
          <div className="flex gap-2 flex-wrap">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Cat })}
              className="border border-border rounded px-3 py-2 bg-card text-sm">
              {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
            </select>
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="tags, comma, separated"
              className="flex-1 min-w-[200px] border border-border rounded px-3 py-2 font-mono text-sm outline-none focus:border-accent" />
            <button disabled={!form.title || !form.body || add.isPending} onClick={() => add.mutate()}
              className="px-5 py-2 bg-navy text-primary-foreground text-[10px] tracking-[2px] uppercase disabled:opacity-50">
              Save
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {filtered.length === 0 && <div className="text-sm text-muted-foreground italic">Nothing here yet.</div>}
        {filtered.map((e: any) => (
          <div key={e.id} className="p-5 border border-border rounded bg-card group">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1">
                <div className="flex items-baseline gap-3">
                  <h3 className="font-serif text-lg">{e.title}</h3>
                  <span className="text-[9px] tracking-[2px] uppercase text-accent font-semibold">{CAT_LABEL[e.category as Cat] || e.category}</span>
                </div>
                <div className="mt-3 text-sm whitespace-pre-wrap text-foreground leading-relaxed">{e.body}</div>
                {e.tags?.length > 0 && (
                  <div className="mt-3 flex gap-1.5 flex-wrap">
                    {e.tags.map((t: string) => <span key={t} className="text-[10px] px-2 py-0.5 bg-muted rounded">#{t}</span>)}
                  </div>
                )}
              </div>
              <button onClick={() => remove.mutate(e.id)} className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100">×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
