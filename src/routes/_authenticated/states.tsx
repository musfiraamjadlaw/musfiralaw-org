import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/states")({
  head: () => ({ meta: [{ title: "Cognitive States — Cognitive OS" }] }),
  component: StatesPage,
});

type StateKey = "activated" | "overwhelmed" | "hyperfocused" | "analysis_loop" | "exhaustion";

const STATES: {
  key: StateKey;
  label: string;
  description: string;
  recommendation: string;
  module: string;
}[] = [
  {
    key: "activated",
    label: "Activated",
    description: "Energy is available. Attention is directed. Initiation cost is low.",
    recommendation: "Spend it on the work that requires the most cognitive lift — not on inbox.",
    module: "Activation Engine",
  },
  {
    key: "overwhelmed",
    label: "Overwhelmed",
    description: "Too many open loops competing for attention. Working memory is saturated.",
    recommendation: "Empty everything into Brain Dump. Do not decide. Do not plan. Just discharge.",
    module: "Brain Dump",
  },
  {
    key: "hyperfocused",
    label: "Hyperfocused",
    description: "Locked into a single track. High output, narrow field of view.",
    recommendation: "Protect the session. Suppress notifications. Capture loose threads in the Vault for later, do not chase them now.",
    module: "Knowledge Vault",
  },
  {
    key: "analysis_loop",
    label: "Analysis Loop",
    description: "Circling the same decision without converging. Reasoning has stopped producing new information.",
    recommendation: "Move it into the Courtroom. Separate Facts from Assumptions. Set a deadline for a Conclusion.",
    module: "Courtroom",
  },
  {
    key: "exhaustion",
    label: "Cognitive Exhaustion",
    description: "Decisions feel heavy. Quality of judgment is degrading. Continuing now creates rework later.",
    recommendation: "Stop. Do not start anything that requires a decision. Restore before next session.",
    module: "—",
  },
];

const STORAGE_KEY = "cognitive_state_current";

function StatesPage() {
  const [current, setCurrent] = useState<StateKey | null>(null);

  useEffect(() => {
    const v = localStorage.getItem(STORAGE_KEY) as StateKey | null;
    if (v) setCurrent(v);
  }, []);

  function pick(k: StateKey) {
    setCurrent(k);
    localStorage.setItem(STORAGE_KEY, k);
  }

  const active = STATES.find((s) => s.key === current);

  return (
    <div className="space-y-10">
      <header>
        <p className="text-[10px] tracking-[3px] uppercase text-muted-foreground mb-2">Cognitive Core</p>
        <h2 className="font-serif text-3xl mb-2">Cognitive States</h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          The operating system adapts to the state you are in. Name the state honestly. The recommended module follows.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {STATES.map((s) => {
          const isActive = s.key === current;
          return (
            <button
              key={s.key}
              onClick={() => pick(s.key)}
              className={`text-left border rounded-sm p-5 transition-colors ${
                isActive ? "border-accent bg-accent/5" : "border-border hover:border-navy/40"
              }`}
            >
              <div className="flex items-baseline justify-between mb-2">
                <span className="font-serif text-lg">{s.label}</span>
                {isActive && (
                  <span className="text-[9px] tracking-[2px] uppercase text-accent">Current</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
            </button>
          );
        })}
      </section>

      {active && (
        <section className="border-l-2 border-accent pl-6 py-2">
          <p className="text-[10px] tracking-[3px] uppercase text-muted-foreground mb-2">
            Recommended move — {active.label}
          </p>
          <p className="font-serif text-xl leading-snug mb-3">{active.recommendation}</p>
          <p className="text-[11px] tracking-[2px] uppercase text-muted-foreground">
            Module · {active.module}
          </p>
        </section>
      )}
    </div>
  );
}
