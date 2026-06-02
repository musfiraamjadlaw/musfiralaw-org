import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askAI } from "@/lib/ai.functions";
import { Waves, AlertTriangle, Clock, Hourglass, Network, Compass } from "lucide-react";

export const Route = createFileRoute("/_authenticated/start")({
  head: () => ({
    meta: [
      { title: "Start — Untangle" },
      { name: "description", content: "Name what you're frozen on. Get one specific first move." },
    ],
  }),
  component: StartPage,
});

const CONDITIONS = [
  { name: "Interest", Icon: Waves, color: "#1A6FB5", note: "The brain makes its own dopamine here. Focus arrives on its own. Can't force it for things that genuinely don't interest you." },
  { name: "Challenge", Icon: AlertTriangle, color: "#C0392B", note: "Real difficulty activates the brain. Too easy = no signal. Too hard = shutdown. Use your peak hours for this." },
  { name: "Urgency", Icon: Clock, color: "#C87D0E", note: "External deadline as fuel. Not yet = miss. The clock becomes the engine when nothing else fires." },
  { name: "Novelty", Icon: Hourglass, color: "#C87D0E", note: "New things fire fast but have a shelf life. When something feels novel — move on it now while the activation is live." },
  { name: "Relationships", Icon: Network, color: "#1A8A4A", note: "Other people change what feels possible. A witness, a collaborator, someone who believes in you — the brain moves for that." },
  { name: "Meaning", Icon: Compass, color: "#7B3FA8", note: "Identity-level connection. When the task is yours — really yours — motivation becomes durable. Not a sprint, a direction." },
];

function StartPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [about, setAbout] = useState("");
  const ai = useServerFn(askAI);

  useEffect(() => {
    try { setAbout(localStorage.getItem("untangle:about-you") ?? ""); } catch {}
  }, []);

  async function run() {
    if (!text.trim()) return;
    setLoading(true);
    setResult("");
    try {
      const userContext = about.trim() ? `\n\nAbout this person: ${about}` : "";
      const { text: r } = await ai({
        data: {
          prompt: `You understand the ADHD Interest-Based Nervous System. The brain does not run on willpower — it runs on six activation conditions:

1. Interest — the brain makes its own dopamine. Focus is calm and steady when present.
2. Challenge — real difficulty activates; too easy produces boredom, too hard produces shutdown.
3. Urgency — external deadlines as fuel; the clock becomes the engine.
4. Novelty — new things fire fast but have a shelf life; act while activation is live.
5. Relationships — accountability, a witness, someone who believes in you.
6. Meaning — identity-level connection; when the task is truly theirs, motivation is durable.

When someone is frozen, one of these is missing. Your job is to name which one and prescribe the one physical move that restores it.${userContext}

The person is frozen on this: "${text}"

Return exactly four short blocks, no preamble, no padding:

MISSING CONDITION: [name the one condition that's absent, then one sentence on why]

FIRST MOVE: [one concrete physical action under 2 minutes — name the exact file, app, tab, or object]

WHY IT WORKS: [one sentence connecting this action to the missing condition]

TIME TO START: [realistic estimate for this first step only]`,
        },
      });
      setResult(r);
    } catch (e: any) { alert(e.message); }
    setLoading(false);
  }

  return (
    <div className="space-y-14">

      {/* Input first — no theory gate */}
      <section>
        <p className="text-[10px] tracking-[3px] uppercase text-muted-foreground mb-3">
          Activation Engine
        </p>
        <h1 className="font-serif text-3xl">What are you frozen on?</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Name the task. One sentence. The engine diagnoses what's missing and gives you the first move.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(); }}
          rows={3}
          placeholder="e.g. I need to send that email but I can't start"
          className="w-full mt-6 border border-border rounded p-4 bg-card font-mono text-sm leading-7 outline-none resize-none focus:border-accent"
        />
        <button
          onClick={run}
          disabled={loading || !text.trim()}
          className="mt-4 px-7 py-3 text-[10px] tracking-[2.5px] uppercase disabled:opacity-50 text-white"
          style={{ background: "#C87D0E" }}
        >
          {loading ? "Diagnosing..." : "Give me the first move"}
        </button>

        {result && (
          <div className="mt-8 p-6 border-l-4 bg-card" style={{ borderColor: "#C87D0E" }}>
            <div className="font-mono text-sm leading-loose whitespace-pre-wrap text-foreground">
              {result}
            </div>
            <button
              onClick={() => { setResult(""); setText(""); }}
              className="mt-5 text-[10px] tracking-[2px] uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              Try another →
            </button>
          </div>
        )}
      </section>

      {/* Theory below — for when you want to understand, not as a gate */}
      <section className="pt-4 border-t border-border">
        <p className="text-[10px] tracking-[3px] uppercase text-muted-foreground mb-3">
          The framework
        </p>
        <h2 className="font-serif text-2xl mb-3">Why you freeze</h2>
        <p className="font-serif text-base text-foreground/80 leading-relaxed max-w-2xl">
          The ADHD brain doesn't run on willpower. It runs on a specific set of conditions. When one is missing, action stalls — not because you're lazy, but because your nervous system doesn't have the signal it needs to fire.
        </p>
        <p className="mt-3 font-serif italic text-muted-foreground max-w-2xl">
          The question is never "why aren't you trying harder." It's "which condition is absent."
        </p>
        <ul className="mt-8 grid gap-px sm:grid-cols-2 border border-border bg-border">
          {CONDITIONS.map(({ name, Icon, color, note }) => (
            <li key={name} className="bg-background p-5">
              <div className="flex items-start gap-3">
                <Icon className="h-4 w-4 mt-1 shrink-0" strokeWidth={1.5} style={{ color }} />
                <div>
                  <p className="font-serif text-lg leading-none">{name}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{note}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
