import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { askAI } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/courtroom")({
  head: () => ({
    meta: [
      { title: "Courtroom — Untangle" },
      { name: "description", content: "Examine a situation like a litigator: separate facts from assumptions, weigh evidence, consider alternatives, reach a verdict." },
      { property: "og:title", content: "Courtroom — Untangle" },
      { property: "og:description", content: "Stress-test your thinking. Separate facts from assumptions and weigh the evidence." },
      { property: "og:url", content: "/courtroom" },
    ],
    links: [{ rel: "canonical", href: "/courtroom" }],
  }),
  component: CourtroomPage,
});

type Verdict = {
  facts: string;
  assumptions: string;
  evidence: string;
  alternatives: string;
  verdict: string;
};

function CourtroomPage() {
  const [situation, setSituation] = useState("");
  const [result, setResult] = useState<Verdict | null>(null);
  const [loading, setLoading] = useState(false);
  const ai = useServerFn(askAI);
  const qc = useQueryClient();

  const { data: history = [] } = useQuery({
    queryKey: ["court"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courtroom_entries").select("*").order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (v: Verdict & { situation: string }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("courtroom_entries").insert({ user_id: u.user.id, ...v });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["court"] }),
  });

  async function deliberate() {
    if (!situation.trim()) return;
    setLoading(true); setResult(null);
    try {
      const { text: raw } = await ai({
        data: {
          prompt: `Apply structured reasoning to this situation: "${situation}"\n\nReturn JSON with these exact keys, each a short paragraph or bullet list (plain text, no markdown):\n- facts: what is objectively true and verifiable\n- assumptions: what is being assumed but not proven\n- evidence: specific evidence supporting or undermining the assumptions\n- alternatives: 2-3 alternative explanations worth considering\n- verdict: the clearest conclusion the evidence supports, and the next concrete action\n\nKeep it analytical. No emotional commentary. No reference to identity or relationships.\n\nJSON: {"facts":"...","assumptions":"...","evidence":"...","alternatives":"...","verdict":"..."}`,
          wantJson: true,
        },
      });
      const parsed: Verdict = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setResult(parsed);
      save.mutate({ situation, ...parsed });
    } catch (e: any) { alert(e.message); }
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <h2 className="font-serif text-3xl">The Courtroom.</h2>
        <span className="text-[10px] tracking-[3px] uppercase text-muted-foreground">⚖ structured reasoning</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">State the situation. Separate facts from assumptions. Reach a defensible conclusion.</p>

      <textarea value={situation} onChange={(e) => setSituation(e.target.value)} rows={5}
        placeholder="e.g. The vendor hasn't sent the revised contract in five days. They are stalling the deal."
        className="w-full mt-6 border border-border rounded p-4 bg-card font-mono text-sm leading-7 outline-none resize-none focus:border-accent" />
      <button onClick={deliberate} disabled={loading || !situation.trim()}
        className="mt-4 px-7 py-3 bg-navy text-primary-foreground text-[10px] tracking-[2.5px] uppercase disabled:opacity-50">
        {loading ? "Deliberating..." : "Call to order"}
      </button>

      {result && (
        <div className="mt-10 border border-border rounded bg-card">
          {([
            ["Facts on the record", result.facts, "#1A2744"],
            ["Assumptions presented", result.assumptions, "#C87D0E"],
            ["Evidence reviewed", result.evidence, "#1A6FB5"],
            ["Alternative explanations", result.alternatives, "#7B3FA8"],
            ["Conclusion", result.verdict, "#1A8A4A"],
          ] as const).map(([title, body, color]) => (
            <div key={title} className="p-6 border-b border-border last:border-b-0">
              <div className="text-[9px] tracking-[3px] uppercase font-semibold mb-3" style={{ color }}>{title}</div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{body}</div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-14">
          <div className="text-[10px] tracking-[3px] uppercase text-muted-foreground mb-4">Case history</div>
          <div className="space-y-2">
            {history.map((h: any) => (
              <details key={h.id} className="border border-border rounded bg-card p-4">
                <summary className="cursor-pointer text-sm font-medium">{h.situation.slice(0, 100)}{h.situation.length > 100 ? "…" : ""}</summary>
                <div className="mt-4 text-xs space-y-3 text-muted-foreground">
                  <div><b className="text-foreground">Conclusion:</b> {h.verdict}</div>
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
