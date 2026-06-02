import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type {
  DiagnoseResult,
  ActivationCondition,
} from "@/lib/diagnose.functions";
import { supabase } from "@/integrations/supabase/client";

type CaseRow = {
  id: string;
  input: string;
  result: DiagnoseResult;
  missing_condition: string | null;
  core_question: string | null;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/whiteboard")({
  head: () => ({
    meta: [
      { title: "Whiteboard — The model behind the work" },
      {
        name: "description",
        content:
          "A note on attention, the Activation Framework, and the reasoning behind the last analysis. The intellectual core of the application.",
      },
    ],
  }),
  component: WhiteboardPage,
});

const STORAGE_KEY = "untangle:last-analysis";

// The Activation Framework — the application's visual language.
// Presented here as a scientific model, not a set of motivational tiles.
type Condition = {
  id: ActivationCondition;
  glyph: string;
  one_line: string;
  keywords: [string, string, string];
};

const ACTIVATION: Condition[] = [
  {
    id: "Interest",
    glyph: "≈",
    one_line: "Attention flows toward what genuinely engages it.",
    keywords: ["Natural engagement", "Curiosity", "Momentum"],
  },
  {
    id: "Challenge",
    glyph: "△",
    one_line: "Difficulty calibrated to current ability.",
    keywords: ["Optimal difficulty", "Growth", "Calibration"],
  },
  {
    id: "Urgency",
    glyph: "◷",
    one_line: "A visible cost of delay focuses the system.",
    keywords: ["Time pressure", "Consequences", "Execution"],
  },
  {
    id: "Novelty",
    glyph: "◇",
    one_line: "Difference re-recruits attention that has gone stale.",
    keywords: ["Freshness", "Exploration", "Change"],
  },
  {
    id: "Relationships",
    glyph: "◎",
    one_line: "Other minds in the loop change what is possible to ignore.",
    keywords: ["Accountability", "Mentorship", "Connection"],
  },
  {
    id: "Meaning",
    glyph: "✦",
    one_line: "Connection to identity and purpose stabilizes effort over time.",
    keywords: ["Purpose", "Identity", "Significance"],
  },
];

function WhiteboardPage() {
  const [data, setData] = useState<{ input: string; result: DiagnoseResult } | null>(null);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    (async () => {
      const { data: rows } = await supabase
        .from("untangle_analyses")
        .select("id, input, result, missing_condition, core_question, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (rows && rows.length) {
        const typed = rows as unknown as CaseRow[];
        setCases(typed);
        // If nothing pinned locally, surface the most recent archived case.
        setData((prev) =>
          prev ?? { input: typed[0].input, result: typed[0].result },
        );
        setSelectedId(typed[0].id);
      }
    })();
  }, []);

  function openCase(c: CaseRow) {
    setData({ input: c.input, result: c.result });
    setSelectedId(c.id);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  }

  return (
    <article className="max-w-2xl mx-auto pb-32">
      {/* Masthead — a journal, not a dashboard. */}
      <header className="pt-10 pb-12 border-b border-border">
        <p className="text-[10px] tracking-[4px] uppercase text-muted-foreground">
          The Whiteboard
        </p>
        <h1 className="font-display text-5xl md:text-6xl text-foreground leading-[1.05] mt-4">
          The model behind the work
        </h1>
        <p className="mt-6 font-serif italic text-lg text-muted-foreground leading-relaxed">
          A note on attention, the Activation Framework, and the reasoning the system
          uses to move from observation to understanding.
        </p>
      </header>

      {/* A Note on Attention — verbatim, as a long-form essay. */}
      <Section eyebrow="I" title="A note on attention">
        <Prose>
          <p>
            For years, I thought my problem was discipline.
          </p>
          <p>Then organization.</p>
          <p>Then productivity.</p>
          <p>Then ADHD.</p>
          <p>
            The issue was not attention. The issue was understanding attention.
          </p>
          <p>
            The ADHD brain is often described as having an attention <em>deficit</em>.
            A more useful model is attention <em>regulation</em>. Attention is present.
            The challenge is directing it consistently.
          </p>
          <p>
            This explains why someone can spend hours reading case law, researching
            neuroscience, writing, or learning — while struggling to answer an email.
          </p>
          <p>The question becomes:</p>
        </Prose>

        <PullQuote>
          Why does attention flow easily toward some things and resist others?
        </PullQuote>

        <Prose>
          <p>
            This question became the foundation of the framework that follows.
          </p>
        </Prose>
      </Section>

      {/* The Activation Framework — presented as a scientific model. */}
      <Section eyebrow="II" title="The Activation Framework">
        <Prose>
          <p>
            Attention is not allocated by willpower. It is recruited by conditions.
            When action becomes difficult, one or more of these six conditions is
            usually missing. They are not motivational categories. They are the
            variables that determine whether a system — a brain, a writer, a
            litigator, a researcher — can sustain engagement with a task.
          </p>
        </Prose>

        <dl className="mt-12 space-y-10">
          {ACTIVATION.map((c) => (
            <div key={c.id} className="grid grid-cols-[3.5rem_1fr] gap-x-6 items-baseline">
              <dt
                className="font-display text-5xl text-foreground leading-none text-center"
                aria-hidden="true"
              >
                {c.glyph}
              </dt>
              <dd>
                <h3 className="font-display text-3xl text-foreground leading-tight">
                  {c.id}
                </h3>
                <p className="mt-2 font-serif italic text-muted-foreground leading-relaxed">
                  {c.one_line}
                </p>
                <p className="mt-3 font-sans text-[11px] tracking-[2.5px] uppercase text-muted-foreground">
                  {c.keywords.join(" · ")}
                </p>
              </dd>
            </div>
          ))}
        </dl>

        <PullQuote attribution="Core principle">
          When action becomes difficult, identify the missing condition.
        </PullQuote>

        <Prose>
          <p>
            The framework does not tell a person what to do. It tells them what is
            absent. A missing condition is a diagnosis, not a prescription — but once
            named, the next step usually becomes obvious. Missing Urgency calls for a
            visible deadline. Missing Relationships calls for another person in the
            loop. Missing Meaning calls for a sentence about why the work matters
            before opening the file.
          </p>
          <p>
            The same logic runs underneath every analysis the system produces. Open
            an observation in Untangle and the model picks the missing condition
            first; the action follows from it.
          </p>
        </Prose>
      </Section>

      {/* Intellectual lineage — short, not a memoir. */}
      <Section eyebrow="III" title="Where the model comes from">
        <Prose>
          <p>
            The framework borrows from several traditions, none of them complete on
            their own.
          </p>
          <p>
            <strong>Neuroscience</strong> contributes the architecture: executive
            function, prediction error, dopaminergic salience, the role of arousal
            in narrowing or broadening attention. <strong>Behavioral science</strong>{" "}
            contributes the patterns: how deadlines reshape effort, how loss aversion
            changes what feels urgent, how environments cue action.{" "}
            <strong>Decision theory</strong> contributes the discipline of separating
            facts from assumptions and verdicts from evidence.{" "}
            <strong>Litigation</strong> contributes the habit of building an
            argument out of what is actually on the record, not what one wishes were
            there. <strong>Personal experience</strong> contributes the corrective:
            any model that does not survive contact with a real Tuesday afternoon is
            not yet finished.
          </p>
          <p>
            The Activation Framework is the part that survived. It is the smallest
            set of conditions that, taken together, reliably explain when attention
            holds and when it doesn't.
          </p>
        </Prose>
      </Section>

      {/* Casebook — every Untangle analysis, archived. */}
      <Section eyebrow="IV" title="The casebook">
        <Prose>
          <p>
            Every observation run through Untangle is filed here as a case. The
            board keeps the working one open below; the rest stay on the shelf,
            ready to re-open.
          </p>
        </Prose>
        {cases.length === 0 ? (
          <p className="mt-8 font-serif italic text-muted-foreground">
            No cases on file yet. Open one in{" "}
            <Link to="/untangle" className="underline decoration-foreground/40 hover:decoration-foreground">
              Untangle
            </Link>
            {" "}to begin the record.
          </p>
        ) : (
          <ol className="mt-10 divide-y divide-border/60 border-y border-border/60">
            {cases.map((c, i) => {
              const active = c.id === selectedId;
              const date = new Date(c.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              return (
                <li key={c.id}>
                  <button
                    onClick={() => openCase(c)}
                    className={
                      "w-full text-left py-5 grid grid-cols-[3rem_5.5rem_1fr_auto] gap-x-5 items-baseline hover:bg-muted/40 transition-colors px-2 " +
                      (active ? "bg-muted/60" : "")
                    }
                  >
                    <span className="font-mono text-[10px] tracking-[2px] text-muted-foreground">
                      №{String(cases.length - i).padStart(2, "0")}
                    </span>
                    <span className="font-mono text-[10px] tracking-[2px] uppercase text-muted-foreground">
                      {date}
                    </span>
                    <span className="font-serif italic text-foreground leading-snug truncate">
                      "{c.input}"
                    </span>
                    {c.missing_condition && (
                      <span className="font-sans text-[10px] tracking-[2px] uppercase text-muted-foreground">
                        Missing · {c.missing_condition}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </Section>

      {/* Working case — the open case lives at the bottom, where evidence belongs. */}
      <Section eyebrow="V" title="The working case">
        {data ? (
          <CurrentCase input={data.input} result={data.result} />
        ) : (
          <Prose>
            <p className="italic text-muted-foreground">
              No analysis is open on the board yet. Run an observation in{" "}
              <Link to="/untangle" className="underline decoration-foreground/40 hover:decoration-foreground">
                Untangle
              </Link>
              {" "}and its reasoning — observation, mechanism, missing condition,
              evidence, action — will appear here as the working case.
            </p>
          </Prose>
        )}
      </Section>

      {/* Colophon-style footer — quietly closes the essay. */}
      <footer className="mt-24 pt-8 border-t border-border text-center">
        <p className="font-display italic text-2xl text-foreground leading-snug">
          Observe. Understand. Connect. Act.
        </p>
        <p className="mt-3 font-serif text-sm italic text-muted-foreground">
          The work is moving from descriptions to explanations.
        </p>
      </footer>
    </article>
  );
}

// ---------- Editorial primitives ----------

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-20">
      <div className="flex items-baseline gap-4 mb-8">
        <span className="font-mono text-[11px] tracking-[3px] text-muted-foreground">
          {eyebrow}
        </span>
        <h2 className="font-display text-3xl md:text-4xl text-foreground leading-tight">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-serif text-[18px] leading-[1.75] text-foreground/90 space-y-5 [&_strong]:font-medium [&_strong]:text-foreground">
      {children}
    </div>
  );
}

function PullQuote({
  children,
  attribution,
}: {
  children: React.ReactNode;
  attribution?: string;
}) {
  return (
    <figure className="my-12 mx-auto max-w-xl text-center">
      <blockquote className="font-display italic text-3xl md:text-4xl text-foreground leading-snug">
        “{children}”
      </blockquote>
      {attribution && (
        <figcaption className="mt-4 font-sans text-[10px] tracking-[3px] uppercase text-muted-foreground">
          — {attribution}
        </figcaption>
      )}
    </figure>
  );
}

// ---------- Current case (the pinned Untangle analysis) ----------

function CurrentCase({
  input,
  result,
}: {
  input: string;
  result: DiagnoseResult;
}) {
  const missing = result.mechanism.missing_condition;
  const missingGlyph = ACTIVATION.find((a) => a.id === missing)?.glyph ?? "·";
  const present = new Set(result.mechanism.present_conditions ?? []);

  return (
    <div className="space-y-10">
      <CaseLine label="Observation">
        <p className="font-serif italic text-xl text-foreground leading-relaxed">
          "{input}"
        </p>
        <p className="mt-2 font-serif text-base text-muted-foreground leading-relaxed">
          {result.observation_echo}
        </p>
      </CaseLine>

      <CaseLine label="Core question">
        <p className="font-display italic text-2xl text-foreground leading-snug">
          {result.core_question}
        </p>
        <p className="mt-2 font-serif text-base text-muted-foreground leading-relaxed">
          {result.question_context}
        </p>
      </CaseLine>

      <CaseLine label="Cognitive mechanism">
        <p className="font-serif text-base text-foreground/90 leading-relaxed">
          {result.mechanism.plain}
        </p>
        <p className="mt-3 font-serif text-base text-foreground/80 leading-relaxed">
          {result.mechanism.deeper}
        </p>
        {result.mechanism.citations?.length > 0 && (
          <p className="mt-3 font-mono text-[10px] tracking-wide text-muted-foreground">
            {result.mechanism.citations.join("  ·  ")}
          </p>
        )}
      </CaseLine>

      <CaseLine label="Activation reading">
        <p className="font-serif italic text-base text-foreground/85 leading-relaxed">
          {result.mechanism.activation_reading}
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
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
                    ? "text-foreground/75"
                    : "text-muted-foreground/50")
                }
              >
                <span className="font-display text-xl w-5 text-center leading-none">
                  {c.glyph}
                </span>
                <span className="font-sans text-[11px] tracking-[2px] uppercase">
                  {c.id}
                </span>
                {isMissing && (
                  <span className="ml-auto font-sans text-[9px] tracking-[2px] uppercase text-foreground border-b border-foreground">
                    missing
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </CaseLine>

      <CaseLine label="Missing condition">
        <p className="flex items-baseline gap-4">
          <span className="font-display text-5xl text-foreground leading-none">
            {missingGlyph}
          </span>
          <span className="font-display italic text-3xl text-foreground">{missing}</span>
        </p>
        <p className="mt-3 font-serif text-base text-foreground/85 leading-relaxed">
          {result.action.why_this_emerges}
        </p>
      </CaseLine>

      {result.article && (
        <CaseLine label="Related writing">
          <p className="font-serif text-lg text-foreground">
            {result.article.url ? (
              <a
                href={result.article.url}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-foreground/30 hover:decoration-foreground"
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
          <p className="mt-2 font-serif text-base text-foreground/85 leading-relaxed">
            {result.article.why_relevant}
          </p>
        </CaseLine>
      )}

      <CaseLine label="Related research">
        <p className="font-serif text-lg text-foreground">{result.study.title}</p>
        <p className="font-mono text-[10px] tracking-wide text-muted-foreground mt-1">
          {result.study.authors} · {result.study.year}
        </p>
        <p className="mt-3 font-serif text-base text-foreground/85 leading-relaxed">
          {result.study.finding}
        </p>
        <p className="mt-2 font-serif italic text-sm text-muted-foreground leading-relaxed">
          {result.study.why_it_deepens}
        </p>
      </CaseLine>

      <CaseLine label="Suggested action">
        <p className="font-display text-2xl text-foreground leading-snug">
          {result.action.step}
        </p>
        <p className="mt-3 font-serif italic text-sm text-muted-foreground leading-relaxed">
          The step emerges from the missing condition ({missing}), not from a generic checklist.
        </p>
      </CaseLine>
    </div>
  );
}

function CaseLine({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid md:grid-cols-[10rem_1fr] gap-x-8 gap-y-2 pb-8 border-b border-border/60 last:border-b-0 last:pb-0">
      <p className="font-sans text-[10px] tracking-[3px] uppercase text-muted-foreground pt-1">
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}
