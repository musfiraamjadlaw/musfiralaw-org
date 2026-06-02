import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { askAI } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/dump")({
  head: () => ({ meta: [{ title: "Brain Dump — Untangle" }] }),
  component: DumpPage,
});

const CATS: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  work:     { label: "WORK",     color: "#1A2744", bg: "#EEF1F8", emoji: "▤" },
  personal: { label: "PERSONAL", color: "#1A6FB5", bg: "#EEF5FD", emoji: "◎" },
  learning: { label: "LEARNING", color: "#1A8A4A", bg: "#EDF7F2", emoji: "◇" },
  creative: { label: "CREATIVE", color: "#C87D0E", bg: "#FEF9EF", emoji: "✦" },
  health:   { label: "HEALTH",   color: "#7B3FA8", bg: "#F4EEF9", emoji: "◈" },
};

function DumpPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [localNotes, setLocalNotes] = useState<any[]>([]);
  const ai = useServerFn(askAI);
  const qc = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: supabaseNotes = [] } = useQuery({
    queryKey: ["notes", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.from("notes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const notes = userId ? supabaseNotes : localNotes;

  const toggleDone = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      if (userId) {
        const { error } = await supabase.from("notes").update({ done }).eq("id", id);
        if (error) throw error;
      } else {
        setLocalNotes(prev => prev.map(n => n.id === id ? { ...n, done } : n));
      }
    },
    onSuccess: () => { if (userId) qc.invalidateQueries({ queryKey: ["notes", userId] }); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (userId) {
        const { error } = await supabase.from("notes").delete().eq("id", id);
        if (error) throw error;
      } else {
        setLocalNotes(prev => prev.filter(n => n.id !== id));
      }
    },
    onSuccess: () => { if (userId) qc.invalidateQueries({ queryKey: ["notes", userId] }); },
  });

  async function sortIt() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const { text: raw } = await ai({
        data: {
          prompt: `Brain dump from the user:\n\n"${text}"\n\nParse into individual tasks or items. Assign each to one of: work, personal, learning, creative, or health. Set priority: high, medium, or low.\n\nJSON: {"items":[{"text":"...","category":"work","priority":"high"}]}`,
          wantJson: true,
        },
      });
      const { items } = JSON.parse(raw.replace(/```json|```/g, "").trim());

      if (userId) {
        const rows = (items as any[]).map((i) => ({
          user_id: userId, text: i.text, category: i.category, priority: i.priority,
        }));
        const { error } = await supabase.from("notes").insert(rows);
        if (error) throw error;
        qc.invalidateQueries({ queryKey: ["notes", userId] });
      } else {
        const newItems = (items as any[]).map((i, idx) => ({
          id: String(Date.now() + idx), text: i.text, category: i.category, priority: i.priority, done: false,
        }));
        setLocalNotes(prev => [...newItems, ...prev]);
      }
      setText("");
    } catch (e: any) {
      alert(e.message ?? "Something went wrong");
    } finally { setLoading(false); }
  }

  const grouped = Object.keys(CATS).map((k) => ({ key: k, items: notes.filter((n: any) => n.category === k) }));

  return (
    <div>
      <h2 className="font-serif text-3xl">Brain Dump.</h2>
      <p className="mt-2 text-sm text-muted-foreground">Everything on your mind. One line or twenty. Don't organize it. Just type.</p>

      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8}
        placeholder={"finish that report\ncall about the appointment\nlook into that course..."}
        className="w-full mt-6 border border-border rounded p-4 bg-card font-mono text-sm leading-7 outline-none resize-none focus:border-accent" />

      <button onClick={sortIt} disabled={loading || !text.trim()}
        className="mt-4 px-7 py-3 bg-navy text-primary-foreground text-[10px] tracking-[2.5px] uppercase disabled:opacity-50">
        {loading ? "Sorting..." : "Sort it"}
      </button>

      {notes.length > 0 && (
        <div className="mt-12">
          <div className="text-[10px] tracking-[3px] uppercase text-muted-foreground mb-6">
            {notes.length} items
          </div>
          {grouped.map(({ key, items }) => {
            if (!items.length) return null;
            const cat = CATS[key];
            return (
              <div key={key} className="mb-7">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">{cat.emoji}</span>
                  <span className="text-[9px] tracking-[3px] font-semibold" style={{ color: cat.color }}>{cat.label}</span>
                </div>
                {items.map((item: any) => (
                  <div key={item.id} className="p-3 mb-2 flex justify-between items-center group"
                    style={{ background: cat.bg, borderLeft: `3px solid ${cat.color}`, opacity: item.done ? 0.5 : 1 }}>
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input type="checkbox" checked={item.done} onChange={(e) => toggleDone.mutate({ id: item.id, done: e.target.checked })} />
                      <span className={`text-sm ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{item.text}</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] tracking-[1px] uppercase" style={{ color: item.priority === "high" ? "#C0392B" : item.priority === "medium" ? "#C87D0E" : "#BBB" }}>
                        {item.priority}
                      </span>
                      <button onClick={() => remove.mutate(item.id)} className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100">×</button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
