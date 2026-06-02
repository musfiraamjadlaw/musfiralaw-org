import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { diagnose, type DiagnoseResult } from "@/lib/diagnose.functions";

export const Route = createFileRoute("/_authenticated/untangle")({
  head: () => ({ meta: [{ title: "Untangle — Cognitive OS" }] }),
  component: DiagnosePage,
});

const EXAMPLES = [
  "I have a million things to do.",
  "I can't focus.",
  "I keep thinking about them.",
  "I don't know where to start.",
  "Something about this isn't sitting right.",
  "I keep avoiding this and I don't know why.",
  "I can't tell if this is intuition or avoidance.",
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
          <p className="mt-6 text-center font-serif text-foreground/90">
            From description to explanation.
          </p>
          <p className="mt-2 text-center text-xs tracking-[2px] uppercase text-muted-foreground">
            Observation · Question · Mechanism · Reflection · Action
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
              {loading ? "Thinking…" : "Untangle"}
            </button>
            <span className="text-[10px] tracking-[2px] uppercase text-muted-foreground">
              ⌘ + Enter
            </span>
          </div>

          {err && <p className="mt-6 text-sm text-red-700 text-center">{err}</p>}
        </div>
      )}

      {result && (
        <article className="space-y-16 pt-4 pb-20">
          {/* 1. Observation */}
          <Step number="01" label="Observation">
            <blockquote className="pl-5 border-l-2 border-foreground font-serif italic text-2xl text-foreground leading-relaxed">
              {submittedInput}
            </blockquote>
            <p className="mt-4 font-serif text-muted-foreground">
              {result.observation_echo}
            </p>
          </Step>

          {/* 2. Core Question */}
          <Step number="02" label="The question underneath">
            <p className="font-serif italic text-3xl text-foreground leading-snug">
              {result.core_question}
            </p>
            <p className="mt-4 font-serif text-foreground/80 leading-relaxed">
              {result.question_context}
            </p>
          </Step>

          {/* 3. Mechanism */}
          <Step number="03" label="What may be happening">
            <p className="font-serif text-xl text-foreground leading-relaxed">
              {result.mechanism.plain}
            </p>
            <p className="mt-5 font-serif text-base text-foreground/80 leading-relaxed">
              {result.mechanism.deeper}
            </p>
            {result.mechanism.citations?.length > 0 && (
              <p className="mt-4 font-mono text-[11px] text-muted-foreground">
                {result.mechanism.citations.join(" · ")}
              </p>
            )}
          </Step>

          {/* 4. You've thought about this before */}
          {result.article && (
            <Step number="04" label="You've thought about this before">
              <h4 className="font-serif text-2xl text-foreground leading-snug">
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
              <p className="mt-3 font-serif italic text-muted-foreground">
                The question it explores: {result.article.question_it_explores}
              </p>
              <p className="mt-3 font-serif text-foreground/85 leading-relaxed">
                {result.article.why_relevant}
              </p>
              <p className="mt-3 font-serif text-foreground/85 leading-relaxed">
                {result.article.insight}
              </p>
            </Step>
          )}

          {/* 5. Related Research */}
          <Step number={result.article ? "05" : "04"} label="Related research">
            <p className="font-serif text-xl text-foreground">{result.study.title}</p>
            <p className="font-serif text-sm text-muted-foreground mt-1">
              {result.study.authors} ({result.study.year})
            </p>
            <p className="mt-3 font-serif text-foreground/85 leading-relaxed">
              {result.study.finding}
            </p>
            <p className="mt-3 font-serif italic text-muted-foreground leading-relaxed">
              {result.study.why_it_deepens}
            </p>
            <p className="mt-3 font-mono text-[11px] text-muted-foreground">
              {result.study.citation}
            </p>
          </Step>

          {/* 6. Related Book */}
          <Step number={result.article ? "06" : "05"} label="A book to sit with">
            <p className="font-serif text-xl text-foreground">
              <em>{result.book.title}</em> — {result.book.author}
            </p>
            <p className="mt-3 font-serif text-foreground/85 leading-relaxed">
              {result.book.why}
            </p>
          </Step>

          {/* 7. A Better Question */}
          <Step number={result.article ? "07" : "06"} label="A better question">
            <p className="font-serif italic text-3xl text-foreground leading-snug">
              {result.better_question}
            </p>
          </Step>

          {/* 8. Action */}
          <Step number={result.article ? "08" : "07"} label="One next step">
            <p className="font-serif text-2xl text-foreground leading-snug">
              {result.action.step}
            </p>
            <p className="mt-4 font-serif italic text-muted-foreground leading-relaxed">
              {result.action.why_this_emerges}
            </p>
          </Step>

          <div className="pt-8 border-t border-border flex gap-3">
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

function Step({
  number,
  label,
  children,
}: {
  number: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-4 mb-5 border-b border-border pb-2">
        <span className="font-mono text-[10px] tracking-[2px] text-muted-foreground">
          {number}
        </span>
        <h3 className="font-serif italic text-foreground text-lg">{label}</h3>
      </div>
      {children}
    </section>
  );
}
