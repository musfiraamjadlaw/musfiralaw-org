import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/mentors")({
  head: () => ({ meta: [{ title: "Mentor Vault — MusfiraOS" }] }),
  component: MentorsPage,
});

function MentorsPage() {
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ mentor_name: "", role: "", lesson: "", source: "", tags: "" });
  const qc = useQueryClient();

  const { data: lessons = [] } = useQuery({
    queryKey: ["mentors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("mentor_lessons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("mentor_lessons").insert({
        user_id: u.user.id,
        mentor_name: form.mentor_name,
        role: form.role || null,
        lesson: form.lesson,
        source: form.source || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mentors"] });
      setForm({ mentor_name: "", role: "", lesson: "", source: "", tags: "" });
      setAdding(false);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mentor_lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mentors"] }),
  });

  const filtered = lessons.filter((l: any) => {
    if (!q) return true;
    const hay = `${l.mentor_name} ${l.role} ${l.lesson} ${l.source} ${(l.tags || []).join(" ")}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const byMentor = filtered.reduce((acc: Record<string, any[]>, l: any) => {
    (acc[l.mentor_name] ||= []).push(l);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <h2 className="font-serif text-3xl">Mentor Vault.</h2>
        <span className="text-[10px] tracking-[3px] uppercase text-muted-foreground">🎓 lessons & wisdom</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Attorneys, mentors, professors, books. Everything they taught you.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search lessons or mentors…"
          className="flex-1 min-w-[200px] border border-border rounded px-3 py-2 bg-card font-mono text-sm outline-none focus:border-accent" />
        <button onClick={() => setAdding((a) => !a)} className="px-4 py-2 bg-navy text-primary-foreground text-[10px] tracking-[2px] uppercase">
          {adding ? "Close" : "+ Capture lesson"}
        </button>
      </div>

      {adding && (
        <div className="mt-4 p-5 border border-border rounded bg-card space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.mentor_name} onChange={(e) => setForm({ ...form, mentor_name: e.target.value })} placeholder="Mentor name"
              className="border-b border-border bg-transparent py-2 outline-none focus:border-accent" />
            <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Role (Attorney, Professor, Author…)"
              className="border-b border-border bg-transparent py-2 outline-none focus:border-accent" />
          </div>
          <textarea value={form.lesson} onChange={(e) => setForm({ ...form, lesson: e.target.value })} rows={4} placeholder="The lesson, in their words or yours…"
            className="w-full border border-border rounded p-3 font-mono text-sm outline-none resize-none focus:border-accent" />
          <div className="flex gap-2 flex-wrap">
            <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Source (conversation, book chapter, deposition…)"
              className="flex-1 min-w-[180px] border border-border rounded px-3 py-2 text-sm outline-none focus:border-accent" />
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="tags"
              className="flex-1 min-w-[180px] border border-border rounded px-3 py-2 font-mono text-sm outline-none focus:border-accent" />
            <button disabled={!form.mentor_name || !form.lesson || add.isPending} onClick={() => add.mutate()}
              className="px-5 py-2 bg-navy text-primary-foreground text-[10px] tracking-[2px] uppercase disabled:opacity-50">
              Save
            </button>
          </div>
        </div>
      )}

      <div className="mt-10 space-y-8">
        {Object.entries(byMentor).map(([mentor, items]) => (
          <div key={mentor}>
            <div className="flex items-baseline gap-3 mb-3">
              <h3 className="font-serif text-xl">{mentor}</h3>
              <span className="text-[10px] tracking-[2px] uppercase text-muted-foreground">
                {items[0].role} · {items.length} {items.length === 1 ? "lesson" : "lessons"}
              </span>
            </div>
            <div className="space-y-2">
              {items.map((l: any) => (
                <div key={l.id} className="p-4 border-l-2 border-accent bg-card group flex justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{l.lesson}</div>
                    {l.source && <div className="text-xs text-muted-foreground italic mt-2">— {l.source}</div>}
                    {l.tags?.length > 0 && (
                      <div className="mt-2 flex gap-1.5 flex-wrap">
                        {l.tags.map((t: string) => <span key={t} className="text-[10px] px-2 py-0.5 bg-muted rounded">#{t}</span>)}
                      </div>
                    )}
                  </div>
                  <button onClick={() => remove.mutate(l.id)} className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100">×</button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-sm text-muted-foreground italic">No lessons captured yet.</div>}
      </div>
    </div>
  );
}
