import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { diagnose, type DiagnoseResult } from "@/lib/diagnose.functions";

export const Route = createFileRoute("/_authenticated/diagnose")({
  head: () => ({ meta: [{ title: "Diagnose — Cognitive OS" }] }),
  component: DiagnosePage,
});

const EXAMPLES = [
  "I have a million things to do.",
  "I don't know where to start.",
  "I can't focus.",
  "I'm trying to make a decision.",
  "I'm overwhelmed.",
  "I'm stuck.",
];

function DiagnosePage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<DiagnoseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const run = useServerFn(diagnose);

  async function submit() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setErr("");
    setResult(null);
    try {
      const r = await run({ data: { input: input.trim() } });
      setResult(r);
    } catch (e: any) {
      setErr(e.message ?? "Something went wrong.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto">
      {!result && (
        <div className="pt-8">
          <h2 className="font-serif text-4xl text-navy">What's on your mind?</h2>
          <p className="mt-3 text-sm text-muted-foreground italic font-serif">
            Speak plainly. The system will diagnose, not judge.
          </p>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            rows={6}
            placeholder="e.g. I have three deadlines and I keep opening tabs instead of working."
            className="w-full mt-8 border border-border rounded-sm p-5 bg-card font-serif text-lg leading-relaxed outline-none resize-none focus:border-accent"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setInput(ex)}
                className="text-[11px] tracking-wide font-serif italic text-muted-foreground hover:text-navy border border-border/60 px-3 py-1 rounded-full"
              >
                {ex}
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={submit}
              disabled={loading || !input.trim()}
              className="px-8 py-3 text-[10px] tracking-[3px] uppercase disabled:opacity-40 text-white"
              style={{ background: "#1a2745" }}
            >
              {loading ? "Thinking…" : "Diagnose"}
            </button>
            <span className="text-[10px] tracking-[2px] uppercase text-muted-foreground">
              ⌘ + Enter
            </span>
          </div>

          {err && <p className="mt-6 text-sm text-red-700">{err}</p>}
        </div>
      )}

      {result && (
        <article className="space-y-12 pt-4">
          <header>
            <p className="text-[10px] tracking-[3px] uppercase text-muted-foreground mb-2">
              Pattern
            </p>
            <h2 className="font-serif text-3xl text-navy">{result.pattern}</h2>
            <blockquote className="mt-6 pl-5 border-l-2 border-accent font-serif italic text-muted-foreground">
              {input}
            </blockquote>
          </header>

          <Section number="I" title="Diagnosis">
            <p className="font-serif leading-relaxed text-foreground">
              {result.diagnosis.summary}
            </p>
            <p className="mt-3 font-serif leading-relaxed text-foreground">
              <span className="text-[10px] tracking-[2px] uppercase text-muted-foreground mr-2">
                Friction
              </span>
              {result.diagnosis.friction}
            </p>
            <p className="mt-3 font-serif leading-relaxed text-navy font-medium">
              {result.diagnosis.core_problem}
            </p>
          </Section>

          <Section number="II" title="Activation Analysis">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(
                [
                  ["Interest", result.activation.interest],
                  ["Challenge", result.activation.challenge],
                  ["Urgency", result.activation.urgency],
                  ["Novelty", result.activation.novelty],
                  ["Relationships", result.activation.relationships],
                  ["Meaning", result.activation.meaning],
                ] as const
              ).map(([label, val]) => (
                <div key={label} className="border border-border/60 px-3 py-2">
                  <div className="text-[9px] tracking-[2px] uppercase text-muted-foreground">
                    {label}
                  </div>
                  <div className="font-serif text-navy capitalize mt-0.5">{val}</div>
                </div>
              ))}
            </div>
            <p className="mt-5 font-serif leading-relaxed">
              <span className="text-[10px] tracking-[2px] uppercase text-accent mr-2">
                Missing
              </span>
              <span className="text-navy font-medium">{result.activation.missing}.</span>{" "}
              {result.activation.explanation}
            </p>
          </Section>

          <Section number="III" title="Recommended Action">
            <p className="font-serif text-2xl text-navy leading-snug">
              {result.action.next_step}
            </p>
            <p className="mt-3 font-serif italic text-muted-foreground">
              {result.action.why}
            </p>
          </Section>

          <Section number="IV" title="Related Thinking">
            <p className="font-serif leading-relaxed text-foreground">
              {result.related_thinking}
            </p>
          </Section>

          {result.articles.length > 0 && (
            <Section number="V" title="From Your Own Writing">
              <div className="space-y-6">
                {result.articles.map((a) => (
                  <div key={a.id} className="border-l-2 border-accent pl-5">
                    <h4 className="font-serif text-xl text-navy">
                      {a.url ? (
                        <a href={a.url} target="_blank" rel="noreferrer" className="hover:underline">
                          {a.title}
                        </a>
                      ) : (
                        a.title
                      )}
                    </h4>
                    <p className="mt-2 font-serif text-foreground">{a.relevance}</p>
                    <p className="mt-2 text-sm font-serif italic text-muted-foreground">
                      Connecting idea — {a.connecting_idea}
                    </p>
                    <p className="mt-2 text-sm font-serif text-foreground/80">{a.why_read}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] tracking-wide font-serif italic text-muted-foreground">
                You have thought about this before.
              </p>
            </Section>
          )}

          <Section number="VI" title="Intellectual Fuel">
            <div className="space-y-6">
              <div>
                <div className="text-[10px] tracking-[2px] uppercase text-muted-foreground">Book</div>
                <p className="font-serif text-lg text-navy mt-1">
                  <em>{result.fuel.book.title}</em> — {result.fuel.book.author}
                </p>
                <p className="font-serif text-foreground mt-1">{result.fuel.book.why}</p>
              </div>
              <div>
                <div className="text-[10px] tracking-[2px] uppercase text-muted-foreground">Study</div>
                <p className="font-serif text-lg text-navy mt-1">{result.fuel.study.title}</p>
                <p className="font-serif text-sm text-muted-foreground">
                  {result.fuel.study.authors} ({result.fuel.study.year})
                </p>
                <p className="font-serif text-foreground mt-2">{result.fuel.study.summary}</p>
                <p className="font-mono text-xs text-muted-foreground mt-2">
                  {result.fuel.study.citation}
                </p>
              </div>
              <div>
                <div className="text-[10px] tracking-[2px] uppercase text-muted-foreground">
                  Question
                </div>
                <p className="font-serif italic text-xl text-navy mt-1">
                  {result.fuel.question}
                </p>
              </div>
            </div>
          </Section>

          <div className="pt-6 border-t border-border flex gap-3">
            <button
              onClick={() => {
                setResult(null);
                setInput("");
              }}
              className="px-6 py-2 text-[10px] tracking-[3px] uppercase text-white"
              style={{ background: "#1a2745" }}
            >
              New thought
            </button>
            <button
              onClick={() => setResult(null)}
              className="px-6 py-2 text-[10px] tracking-[3px] uppercase border border-border text-navy"
            >
              Refine input
            </button>
          </div>
        </article>
      )}
    </div>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-4 mb-4 border-b border-border pb-2">
        <span className="font-serif italic text-accent text-lg">{number}</span>
        <h3 className="text-[10px] tracking-[3px] uppercase text-muted-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}
