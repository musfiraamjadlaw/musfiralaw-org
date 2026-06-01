import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { askAI } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/meaning")({
  head: () => ({ meta: [{ title: "Meaning Engine — MusfiraOS" }] }),
  component: MeaningPage,
});

const FUTURE_SELVES = ["Future Lawyer", "Future Writer", "Future Mentor", "Future Business Owner"] as const;
const SELF_COLORS: Record<string, string> = {
  "Future Lawyer": "#1A2744",
  "Future Writer": "#1A6FB5",
  "Future Mentor": "#7B3FA8",
  "Future Business Owner": "#C87D0E",
};

function MeaningPage() {
  const [title, setTitle] = useState("");
  const [lane, setLane] = useState("work");
  const [loading, setLoading] = useState(false);
  const ai = useServerFn(askAI);
  const qc = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ["meaning-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async (row: { title: string; lane: string; why: string; future_self: string }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("tasks").insert({ user_id: u.user.id, ...row });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meaning-tasks"] }),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meaning-tasks"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meaning-tasks"] }),
  });

  async function consecrate() {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const { text: raw } = await ai({
        data: {
          prompt: `Musfira wants to do this task: "${title}" (lane: ${lane})\n\nConnect it to her future selves: Future Lawyer, Future Writer, Future Mentor, Future Business Owner.\n\nReturn JSON:\n- future_self: which one of those four this task most serves (exact label)\n- why: one sentence, direct, second-person ("you"), explaining why this matters to that future self. Max 25 words.\n\nJSON: {"future_self":"Future Lawyer","why":"..."}`,
          wantJson: true,
        },
      });
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      await add.mutateAsync({ title, lane, why: parsed.why, future_self: parsed.future_self });
      setTitle("");
    } catch (e: any) { alert(e.message); }
    setLoading(false);
  }

  const grouped = FUTURE_SELVES.map((s) => ({ self: s, items: tasks.filter((t: any) => t.future_self === s) }));

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <h2 className="font-serif text-3xl">Meaning Engine.</h2>
        <span className="text-[10px] tracking-[3px] uppercase text-muted-foreground">✨ why does this matter?</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Every task connects to a future self. No task is just a task.</p>

      <div className="mt-6 p-5 border border-border rounded bg-card space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's the task?"
          className="w-full border-b border-border bg-transparent py-2 font-serif text-lg outline-none focus:border-accent" />
        <div className="flex gap-2 flex-wrap">
          <select value={lane} onChange={(e) => setLane(e.target.value)} className="border border-border rounded px-3 py-2 bg-card text-sm">
            {["work", "writing", "lawschool", "personal", "tutoring"].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <button onClick={consecrate} disabled={loading || !title.trim()}
            className="px-5 py-2 bg-navy text-primary-foreground text-[10px] tracking-[2px] uppercase disabled:opacity-50">
            {loading ? "Finding meaning..." : "Anchor to future self"}
          </button>
        </div>
      </div>

      <div className="mt-10 space-y-8">
        {grouped.map(({ self, items }) => (
          <div key={self}>
            <div className="flex items-baseline gap-3 mb-3">
              <h3 className="font-serif text-xl" style={{ color: SELF_COLORS[self] }}>{self}</h3>
              <span className="text-[10px] tracking-[2px] uppercase text-muted-foreground">
                {items.length} {items.length === 1 ? "task" : "tasks"}
              </span>
            </div>
            {items.length === 0 && <div className="text-sm text-muted-foreground italic">Nothing here yet.</div>}
            <div className="space-y-2">
              {items.map((t: any) => (
                <div key={t.id} className="p-4 border-l-2 bg-card group flex justify-between gap-3" style={{ borderColor: SELF_COLORS[self], opacity: t.status === "done" ? 0.5 : 1 }}>
                  <label className="flex items-start gap-3 flex-1 cursor-pointer">
                    <input type="checkbox" checked={t.status === "done"} onChange={(e) => setStatus.mutate({ id: t.id, status: e.target.checked ? "done" : "todo" })} className="mt-1" />
                    <div>
                      <div className={`text-sm font-medium ${t.status === "done" ? "line-through" : ""}`}>{t.title}</div>
                      {t.why && <div className="text-xs text-muted-foreground italic mt-1">{t.why}</div>}
                      {t.lane && <div className="text-[9px] tracking-[2px] uppercase mt-2 text-muted-foreground">{t.lane}</div>}
                    </div>
                  </label>
                  <button onClick={() => remove.mutate(t.id)} className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100">×</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
