import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { diagnose, type DiagnoseResult } from "@/lib/diagnose.functions";

export const Route = createFileRoute("/_authenticated/untangle")({
  head: () => ({ meta: [{ title: "Untangle — Cognitive OS" }] }),
  component: DiagnosePage,
});

const EXAMPLES = [
  "I'm overwhelmed.",
  "I can't focus.",
  "I don't know where to start.",
  "I'm exhausted.",
  "I'm stressed.",
  "I have too many ideas.",
  "I'm avoiding something.",
];

function DiagnosePage() {
  const [input, setInput] = useState("");
  const [submittedInput, setSubmittedInput] = useState("");
  const [result, setResult] = useState<DiagnoseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const run = useServerFn(diagnose);

  async function submit() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setErr("");
    setResult(null);
    setSubmittedInput(input.trim());
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
        <div className="pt-12">
          <h2 className="font-serif text-5xl text-foreground text-center leading-tight">
            What are you noticing?
          </h2>
          <p className="mt-3 text-center text-muted-foreground font-serif italic">
            Or — what isn't making sense?
          </p>
          <p className="mt-6 text-center text-xs tracking-[2px] uppercase text-muted-foreground">
            Notice · Analyze · Connect · Act
          </p>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            rows={5}
            placeholder="An observation. A friction. A pattern. A question you keep circling."
            className="w-full mt-8 border border-border rounded-sm p-5 bg-card font-serif text-xl leading-relaxed outline-none resize-none focus:border-foreground transition-colors"
          />

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setInput(ex)}
                className="text-xs font-serif italic text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-full transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={submit}
              disabled={loading || !input.trim()}
              className="px-10 py-3 text-[11px] tracking-[3px] uppercase disabled:opacity-40 bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              {loading ? "Untangling…" : "Untangle"}
            </button>
            <span className="text-[10px] tracking-[2px] uppercase text-muted-foreground">
              ⌘ + Enter
            </span>
          </div>

          {err && <p className="mt-6 text-sm text-red-700 text-center">{err}</p>}
        </div>
      )}

      {result && (
        <article className="space-y-14 pt-4">
          <header>
            <p className="text-[10px] tracking-[3px] uppercase text-muted-foreground mb-3">
              You said
            </p>
            <blockquote className="pl-5 border-l-2 border-foreground font-serif italic text-xl text-foreground leading-relaxed">
              {submittedInput}
            </blockquote>
            <p className="mt-4 font-serif text-muted-foreground">{result.echo}</p>
          </header>

          <Section step="1" title="Cognitive Systems Involved">
            <div className="space-y-3">
              {result.systems.map((s) => (
                <div
                  key={s.name}
                  className={`border-l-2 pl-4 py-1 ${
                    s.name === result.primary_system
                      ? "border-foreground"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h4 className="font-serif text-lg text-foreground">{s.name}</h4>
                    <LoadBadge load={s.load} />
                  </div>
                  <p className="mt-1 font-serif text-foreground/80">{s.note}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section step="2" title={`What's Struggling — ${result.primary_system}`}>
            <p className="font-serif text-xl text-foreground leading-relaxed">
              {result.plain_explanation}
            </p>
          </Section>

          <Section step="3" title="The Neuroscience">
            <p className="font-serif text-lg text-foreground leading-relaxed">
              {result.neuroscience}
            </p>
          </Section>

          <Section step="4" title="Intervention">
            <p className="font-serif text-2xl text-foreground leading-snug">
              {result.intervention.action}
            </p>
            <div className="mt-2 text-[10px] tracking-[3px] uppercase text-muted-foreground">
              {result.intervention.duration}
            </div>
            <p className="mt-4 font-serif italic text-muted-foreground leading-relaxed">
              {result.intervention.why_it_works}
            </p>
          </Section>

          <Section step="5" title="What to Read & Sit With">
            <div className="space-y-8">
              {result.article && (
                <Recommendation label="From your Substack">
                  <h4 className="font-serif text-xl text-foreground">
                    {result.article.url ? (
                      <a
                        href={result.article.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {result.article.title}
                      </a>
                    ) : (
                      result.article.title
                    )}
                  </h4>
                  <p className="mt-2 font-serif text-foreground/80">{result.article.why}</p>
                </Recommendation>
              )}

              <Recommendation label="Book">
                <p className="font-serif text-xl text-foreground">
                  <em>{result.book.title}</em> — {result.book.author}
                </p>
                <p className="mt-2 font-serif text-foreground/80">{result.book.why}</p>
              </Recommendation>

              <Recommendation label="Study">
                <p className="font-serif text-xl text-foreground">{result.study.title}</p>
                <p className="font-serif text-sm text-muted-foreground">
                  {result.study.authors} ({result.study.year})
                </p>
                <p className="mt-2 font-serif text-foreground/80">{result.study.finding}</p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  {result.study.citation}
                </p>
              </Recommendation>

              <Recommendation label="Question">
                <p className="font-serif italic text-2xl text-foreground leading-snug">
                  {result.question}
                </p>
              </Recommendation>
            </div>
          </Section>

          <div className="pt-6 border-t border-border flex gap-3">
            <button
              onClick={() => {
                setResult(null);
                setInput("");
                setSubmittedInput("");
              }}
              className="px-6 py-2 text-[10px] tracking-[3px] uppercase bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              Again
            </button>
            <button
              onClick={() => setResult(null)}
              className="px-6 py-2 text-[10px] tracking-[3px] uppercase border border-border text-foreground hover:bg-muted transition-colors"
            >
              Refine
            </button>
          </div>
        </article>
      )}
    </div>
  );
}

function LoadBadge({ load }: { load: "high" | "medium" | "low" }) {
  return (
    <span className="text-[9px] tracking-[2px] uppercase text-muted-foreground">
      {load} load
    </span>
  );
}

function Section({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-4 mb-5 border-b border-border pb-2">
        <span className="font-serif italic text-foreground text-base">{step}</span>
        <h3 className="text-[10px] tracking-[3px] uppercase text-muted-foreground">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

function Recommendation({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] tracking-[2px] uppercase text-muted-foreground mb-2">
        {label}
      </div>
      {children}
    </div>
  );
}
