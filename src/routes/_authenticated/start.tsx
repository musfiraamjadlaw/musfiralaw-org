import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askAI } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/start")({
  head: () => ({ meta: [{ title: "Start — Untangle" }] }),
  component: StartPage,
});

function StartPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const ai = useServerFn(askAI);

  async function run() {
    if (!text.trim()) return;
    setLoading(true); setResult("");
    try {
      const { text: r } = await ai({
        data: {
          prompt: `The user is stuck on this task: "${text}"\n\nReturn exactly three short blocks:\n\nFIRST MOVE: [one concrete physical action they can take in under 2 minutes — name the exact file, app, document, or object]\n\nWHY IT WORKS: [one sentence explaining why this is the right entry point]\n\nTIME ESTIMATE: [realistic time for this first step only]`,
        },
      });
      setResult(r);
    } catch (e: any) { alert(e.message); }
    setLoading(false);
  }

  return (
    <div>
      <h2 className="font-serif text-3xl">Start This.</h2>
      <p className="mt-2 text-sm text-muted-foreground">Stuck on something? Name the task. Get the first move that breaks inertia.</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
        placeholder="e.g. finish the Q3 client proposal"
        className="w-full mt-6 border border-border rounded p-4 bg-card font-mono text-sm leading-7 outline-none resize-none focus:border-accent" />
      <button onClick={run} disabled={loading || !text.trim()}
        className="mt-4 px-7 py-3 text-[10px] tracking-[2.5px] uppercase disabled:opacity-50 text-white"
        style={{ background: "#E8A838" }}>
        {loading ? "Thinking..." : "Give me the first move"}
      </button>
      {result && (
        <div className="mt-8 p-6 border-l-4 border-accent bg-card">
          <div className="font-mono text-sm leading-loose whitespace-pre-wrap text-foreground">{result}</div>
        </div>
      )}
    </div>
  );
}
