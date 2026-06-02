import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type {
  DiagnoseResult,
  ActivationCondition,
} from "@/lib/diagnose.functions";

export const Route = createFileRoute("/_authenticated/whiteboard")({
  head: () => ({
    meta: [
      { title: "Whiteboard — The reasoning behind the analysis" },
      {
        name: "description",
        content:
          "A case board for the last Untangle analysis. Observation, core question, mechanism, activation conditions, related writing, research, and the next action — laid out so you can see how the system reached its conclusions.",
      },
    ],
  }),
  component: WhiteboardPage,
});

const STORAGE_KEY = "untangle:last-analysis";

// The Activation Framework — symbols the user specified.
// This is the application's visual language.
const ACTIVATION: { id: ActivationCondition; glyph: string; gloss: string }[] = [
  { id: "Interest",      glyph: "≈", gloss: "Does it pull attention?" },
  { id: "Challenge",     glyph: "△", gloss: "Is it calibrated to current ability?" },
  { id: "Urgency",       glyph: "◷", gloss: "Is the cost of delay visible?" },
  { id: "Novelty",       glyph: "⌛", gloss: "Is anything different this time?" },
  { id: "Relationships", glyph: "◎", gloss: "Is anyone else in this with you?" },
  { id: "Meaning",       glyph: "✦", gloss: "Is it tied to something cared about?" },
];

function WhiteboardPage() {
  const [data, setData] = useState<{ input: string; result: DiagnoseResult } | null>(null);

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto pt-16 text-center">
        <p className="text-[11px] tracking-[3px] uppercase text-muted-foreground mb-4">
          The whiteboard is empty
        </p>
        <h1 className="font-serif text-4xl text-foreground">Nothing pinned yet.</h1>
        <p className="mt-4 font-serif italic text-muted-foreground max-w-xl mx-auto">
          The Whiteboard is where explanations live. Run an analysis in Untangle and its reasoning will appear here — observation, mechanism, activation, evidence, action — all on one board.
        </p>
        <Link
          to="/untangle"
          className="inline-block mt-8 px-6 py-3 text-[10px] tracking-[3px] uppercase bg-foreground text-background hover:bg-foreground/90 transition-colors"
        >
          Open Untangle
        </Link>

        <ActivationLegend className="mt-20" />
      </div>
    );
  }

  const { input, result } = data;
  const missing = result.mechanism.missing_condition;
  const present = new Set(result.mechanism.present_conditions ?? []);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header — strategy room masthead */}
      <header className="border-b-2 border-foreground pb-4 mb-10 flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] tracking-[3px] uppercase text-muted-foreground">
            Case Board · Untangle Analysis
          </p>
          <h1 className="font-serif text-4xl text-foreground mt-1">Whiteboard</h1>
        </div>
        <p className="font-serif italic text-muted-foreground max-w-md text-right">
          How the system reached its conclusions. The reasoning behind the recommendation, pinned to one board.
        </p>
      </header>

      {/* The board — masonry of cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Observation — pinned at the top-left, the entry point */}
        <BoardCard label="01 · Observation" className="md:col-span-5">
          <p className="font-serif italic text-foreground/90 leading-relaxed">
            "{input}"
          </p>
          <Hairline />
          <p className="font-serif text-sm text-muted-foreground leading-relaxed">
            {result.observation_echo}
          </p>
        </BoardCard>

        {/* Core question */}
        <BoardCard label="02 · Core Question" tone="ink" className="md:col-span-7">
          <p className="font-serif italic text-2xl text-background leading-snug">
            {result.core_question}
          </p>
          <p className="mt-3 font-serif text-sm text-background/75 leading-relaxed">
            {result.question_context}
          </p>
        </BoardCard>

        {/* Cognitive Mechanism */}
        <BoardCard label="03 · Cognitive Mechanism" className="md:col-span-7">
          <p className="font-serif text-foreground leading-relaxed">
            {result.mechanism.plain}
          </p>
          <Hairline />
          <p className="font-serif text-sm text-foreground/80 leading-relaxed">
            {result.mechanism.deeper}
          </p>
          {result.mechanism.citations?.length > 0 && (
            <p className="mt-4 font-mono text-[10px] text-muted-foreground tracking-wide">
              {result.mechanism.citations.join("  ·  ")}
            </p>
          )}
        </BoardCard>

        {/* Activation Conditions — permanent legend, with state */}
        <BoardCard label="04 · Activation Conditions" className="md:col-span-5">
          <p className="font-serif italic text-sm text-muted-foreground leading-relaxed">
            {result.mechanism.activation_reading}
          </p>
          <Hairline />
          <ul className="space-y-2.5">
            {ACTIVATION.map((c) => {
              const isMissing = c.id === missing;
              const isPresent = present.has(c.id);
              return (
                <li
                  key={c.id}
                  className={
                    "flex items-baseline gap-3 " +
                    (isMissing
                      ? "text-foreground"
                      : isPresent
                      ? "text-foreground/80"
                      : "text-muted-foreground/60")
                  }
                >
                  <span
                    className={
                      "font-serif text-xl w-6 text-center leading-none " +
                      (isMissing ? "text-foreground" : "")
                    }
                  >
                    {c.glyph}
                  </span>
                  <span className="text-[12px] tracking-[2px] uppercase font-medium">
                    {c.id}
                  </span>
                  <span className="font-serif italic text-xs text-muted-foreground/80">
                    — {c.gloss}
                  </span>
                  {isMissing && (
                    <span className="ml-auto text-[10px] tracking-[2px] uppercase font-mono text-foreground border border-foreground px-1.5 py-0.5">
                      missing
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </BoardCard>

        {/* Missing Condition — the diagnostic */}
        <BoardCard label="05 · Missing Condition" tone="accent" className="md:col-span-4">
          <div className="flex items-baseline gap-4">
            <span className="font-serif text-6xl text-foreground leading-none">
              {ACTIVATION.find((a) => a.id === missing)?.glyph}
            </span>
            <div>
              <p className="text-[10px] tracking-[3px] uppercase text-muted-foreground">
                Underlying gap
              </p>
              <p className="font-serif italic text-3xl text-foreground">{missing}</p>
            </div>
          </div>
          <Hairline />
          <p className="font-serif text-sm text-foreground/85 leading-relaxed">
            {result.action.why_this_emerges}
          </p>
        </BoardCard>

        {/* Related Writing */}
        <BoardCard label="06 · Related Writing" className="md:col-span-8">
          {result.article ? (
            <>
              <p className="font-serif text-xl text-foreground leading-snug">
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
              </p>
              <p className="mt-2 font-serif italic text-sm text-muted-foreground">
                Explores: {result.article.question_it_explores}
              </p>
              <Hairline />
              <p className="font-serif text-sm text-foreground/85 leading-relaxed">
                {result.article.why_relevant}
              </p>
              <p className="mt-2 font-serif text-sm text-foreground/85 leading-relaxed">
                {result.article.insight}
              </p>
            </>
          ) : (
            <p className="font-serif italic text-muted-foreground">
              Nothing in your corpus matched this idea closely enough to cite.
            </p>
          )}
        </BoardCard>

        {/* Related Research */}
        <BoardCard label="07 · Related Research" className="md:col-span-7">
          <p className="font-serif text-lg text-foreground">{result.study.title}</p>
          <p className="font-mono text-[11px] text-muted-foreground mt-1">
            {result.study.authors} · {result.study.year}
          </p>
          <Hairline />
          <p className="font-serif text-sm text-foreground/85 leading-relaxed">
            {result.study.finding}
          </p>
          <p className="mt-2 font-serif italic text-sm text-muted-foreground leading-relaxed">
            {result.study.why_it_deepens}
          </p>
          <p className="mt-3 font-mono text-[10px] text-muted-foreground">
            {result.study.citation}
          </p>
        </BoardCard>

        {/* Book — small adjacent card */}
        <BoardCard label="A book to sit with" className="md:col-span-5">
          <p className="font-serif text-lg text-foreground">
            <em>{result.book.title}</em>
          </p>
          <p className="font-serif text-sm text-muted-foreground mt-1">{result.book.author}</p>
          <Hairline />
          <p className="font-serif text-sm text-foreground/85 leading-relaxed">{result.book.why}</p>
        </BoardCard>

        {/* Better Question */}
        <BoardCard label="A better question" className="md:col-span-7">
          <p className="font-serif italic text-2xl text-foreground leading-snug">
            {result.better_question}
          </p>
        </BoardCard>

        {/* Suggested Action — the resolution, bottom of the board */}
        <BoardCard label="08 · Suggested Action" tone="ink" className="md:col-span-12">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <p className="font-serif text-2xl text-background leading-snug">
                {result.action.step}
              </p>
              <p className="mt-3 font-serif italic text-sm text-background/75 leading-relaxed">
                This step emerges from the missing condition ({missing}) — not from a generic checklist.
              </p>
            </div>
            <div className="border-l border-background/30 pl-6">
              <p className="text-[10px] tracking-[3px] uppercase text-background/60 mb-2">
                Why this and not another
              </p>
              <p className="font-serif text-sm text-background/85 leading-relaxed">
                {result.action.why_this_emerges}
              </p>
            </div>
          </div>
        </BoardCard>
      </div>

      <div className="mt-12 pt-6 border-t border-border flex flex-wrap gap-3 items-center justify-between">
        <p className="font-serif italic text-sm text-muted-foreground">
          The Whiteboard is the application's operating model. Every analysis lives here.
        </p>
        <Link
          to="/untangle"
          className="px-5 py-2 text-[10px] tracking-[3px] uppercase border border-border hover:bg-muted transition-colors"
        >
          New observation →
        </Link>
      </div>
    </div>
  );
}

function BoardCard({
  label,
  children,
  className = "",
  tone = "paper",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  tone?: "paper" | "ink" | "accent";
}) {
  const base =
    tone === "ink"
      ? "bg-foreground text-background border-foreground"
      : tone === "accent"
      ? "bg-muted/60 border-foreground/40"
      : "bg-card border-border";
  return (
    <section
      className={`relative border ${base} p-6 rounded-sm shadow-sm ${className}`}
    >
      <p
        className={
          "text-[10px] tracking-[3px] uppercase mb-4 " +
          (tone === "ink" ? "text-background/60" : "text-muted-foreground")
        }
      >
        {label}
      </p>
      {children}
    </section>
  );
}

function Hairline() {
  return <div className="my-4 h-px bg-border/70" />;
}

function ActivationLegend({ className = "" }: { className?: string }) {
  return (
    <div className={"text-left max-w-xl mx-auto " + className}>
      <p className="text-[10px] tracking-[3px] uppercase text-muted-foreground mb-3 text-center">
        The Activation Framework
      </p>
      <ul className="space-y-2">
        {ACTIVATION.map((c) => (
          <li key={c.id} className="flex items-baseline gap-3">
            <span className="font-serif text-xl w-6 text-center text-foreground">
              {c.glyph}
            </span>
            <span className="text-[12px] tracking-[2px] uppercase">{c.id}</span>
            <span className="font-serif italic text-xs text-muted-foreground">
              — {c.gloss}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
