import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askAI } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/untangle")({
  head: () => ({ meta: [{ title: "Untangle — Notebook" }] }),
  component: UntanglePage,
});

type Step = { step: number; action: string; minutes: number; note?: string };

function UntanglePage() {
  const [text, setText] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const ai = useServerFn(askAI);

  async function run() {
    if (!text.trim()) return;
    setLoading(true); setSteps([]); setDone({});
    try {
      const { text: raw } = await ai({
        data: {
          prompt: `The user says this project is too big: "${text}"\n\nBreak it into 3–7 ordered micro-steps. Each under 20 minutes. Use action verbs. Name specific tools, documents, or systems where possible.\n\nJSON: {"steps":[{"step":1,"action":"...","minutes":10,"note":"optional short tip"}]}`,
          wantJson: true,
        },
      });
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setSteps(parsed.steps || []);
    } catch (e: any) { alert(e.message); }
    setLoading(false);
  }

  return (
    <div>
      <h2 className="font-serif text-3xl">Untangle This.</h2>
      <p className="mt-2 text-sm text-muted-foreground">Big project? Paste it. Walk out with a list you can actually execute.</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
        placeholder="e.g. launch the new pricing page"
        className="w-full mt-6 border border-border rounded p-4 bg-card font-mono text-sm leading-7 outline-none resize-none focus:border-accent" />
      <button onClick={run} disabled={loading || !text.trim()}
        className="mt-4 px-7 py-3 text-[10px] tracking-[2.5px] uppercase text-white disabled:opacity-50"
        style={{ background: "#1A8A4A" }}>
        {loading ? "Untangling..." : "Break it down"}
      </button>
      {steps.length > 0 && (
        <div className="mt-10">
          <div className="text-[10px] tracking-[3px] uppercase text-muted-foreground mb-5">
            {steps.length} steps
          </div>
          {steps.map((s, i) => {
            const isDone = !!done[i];
            return (
              <div key={i} className="flex gap-3 items-start p-4 mb-1.5 border-l-2"
                style={{ background: isDone ? "#F7F7F7" : "#EDF7F2", borderColor: isDone ? "#CCC" : "#1A8A4A", opacity: isDone ? 0.55 : 1 }}>
                <button onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5"
                  style={{ borderColor: isDone ? "#CCC" : "#1A8A4A", background: isDone ? "#CCC" : "transparent" }}>
                  {isDone && <span className="text-white text-[9px]">✓</span>}
                </button>
                <div className="flex-1">
                  <div className={`text-sm ${isDone ? "line-through text-muted-foreground" : ""}`}>{s.action}</div>
                  {s.note && <div className="text-xs text-muted-foreground italic mt-1">{s.note}</div>}
                </div>
                <div className="text-[10px] text-muted-foreground tracking-wider">~{s.minutes}m</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
