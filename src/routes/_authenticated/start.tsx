import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askAI } from "@/lib/ai.functions";
import { Waves, AlertTriangle, Clock, Hourglass, Network, Compass } from "lucide-react";

export const Route = createFileRoute("/_authenticated/start")({
  head: () => ({ meta: [{ title: "Act — Untangle" }] }),
  component: StartPage,
});

const CONDITIONS = [
  {
    name: "Interest",
    Icon: Waves,
    note: "Sustained attention. Curiosity reduces friction; focus emerges as momentum rather than effort.",
  },
  {
    name: "Challenge",
    Icon: AlertTriangle,
    note: "Calibration. Between comfort and panic — too little produces boredom, too much produces overwhelm.",
  },
  {
    name: "Urgency",
    Icon: Clock,
    note: "Time introduces consequence. Deadlines narrow attention and convert intention into execution.",
  },
  {
    name: "Novelty",
    Icon: Hourglass,
    note: "The motivational lifespan of repetition is finite. New angles, environments, or framings restore activation.",
  },
  {
    name: "Relationships",
    Icon: Network,
    note: "Accountability and shared purpose. A mentor, collaborator, or witness changes what feels possible.",
  },
  {
    name: "Meaning",
    Icon: Compass,
    note: "Why does this matter? When action connects to values or identity, motivation becomes durable.",
  },
];

function StartPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const ai = useServerFn(askAI);

  async function run() {
    if (!text.trim()) return;
    setLoading(true);
    setResult("");
    try {
      const { text: r } = await ai({
        data: {
          prompt: `You are an analyst working from The Activation Framework. The framework holds that action is rarely a failure of willpower — it is the result of specific cognitive conditions being present or absent. The six conditions are:

1. Interest — sustained attention through curiosity
2. Challenge — calibration between boredom and overwhelm
3. Urgency — time introducing consequence
4. Novelty — newness restoring attention
5. Relationships — accountability, connection, shared purpose
6. Meaning — connection to values, identity, or larger goal

The user is stuck on this task: "${text}"

Diagnose which condition is most likely missing, then prescribe the first move. Return exactly four short blocks, no preamble:

MISSING CONDITION: [name one of the six conditions, then one sentence on why it is missing here]

FIRST MOVE: [one concrete physical action they can take in under 2 minutes — name the exact file, app, document, or object]

WHY IT WORKS: [one sentence linking the action back to the missing condition]

TIME ESTIMATE: [realistic time for this first step only]`,
        },
      });
      setResult(r);
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-16">
      <section>
        <p className="text-[10px] tracking-[3px] uppercase text-muted-foreground mb-3">
          Field guide
        </p>
        <h2 className="font-serif text-3xl leading-tight">The Activation Framework</h2>
        <div
          className="mt-4 max-w-2xl text-foreground/80"
          style={{ fontFamily: "var(--font-serif)", fontSize: "17px", lineHeight: 1.7 }}
        >
          <p>
            Human behavior is often treated as a question of discipline. This tool starts from a
            different assumption: action is rarely a matter of willpower alone. More often, it is
            the result of specific cognitive conditions being present — or absent.
          </p>
          <p className="mt-3 italic text-muted-foreground">
            When progress stalls, the question is not <em>"why am I not trying harder?"</em> — it is{" "}
            <em>"what condition for action is missing?"</em>
          </p>
        </div>

        <ul className="mt-8 grid gap-px sm:grid-cols-2 border border-border bg-border">
          {CONDITIONS.map(({ name, Icon, note }) => (
            <li key={name} className="bg-background p-5">
              <div className="flex items-start gap-3">
                <Icon className="h-4 w-4 mt-1 text-accent shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="font-serif text-lg leading-none">{name}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{note}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 border-l-2 border-accent pl-5 max-w-2xl">
          <p className="text-[10px] tracking-[3px] uppercase text-muted-foreground mb-2">
            Core principle
          </p>
          <p
            className="text-foreground"
            style={{ fontFamily: "var(--font-serif)", fontSize: "18px", lineHeight: 1.6 }}
          >
            Every problem contains a pattern. Every pattern has a mechanism. Every mechanism
            suggests an intervention. When action becomes difficult, the objective is not to
            increase effort — it is to identify the missing condition and restore it.
          </p>
        </div>
      </section>

      <section>
        <p className="text-[10px] tracking-[3px] uppercase text-muted-foreground mb-3">
          Activation Engine
        </p>
        <h2 className="font-serif text-3xl">Start This.</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Name the task. The engine diagnoses which condition is missing and returns the first move
          that breaks inertia.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="e.g. finish the Q3 client proposal"
          className="w-full mt-6 border border-border rounded p-4 bg-card font-mono text-sm leading-7 outline-none resize-none focus:border-accent"
        />
        <button
          onClick={run}
          disabled={loading || !text.trim()}
          className="mt-4 px-7 py-3 text-[10px] tracking-[2.5px] uppercase disabled:opacity-50 text-white"
          style={{ background: "#E8A838" }}
        >
          {loading ? "Diagnosing..." : "Diagnose & give me the first move"}
        </button>
        {result && (
          <div className="mt-8 p-6 border-l-4 border-accent bg-card">
            <div className="font-mono text-sm leading-loose whitespace-pre-wrap text-foreground">
              {result}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
