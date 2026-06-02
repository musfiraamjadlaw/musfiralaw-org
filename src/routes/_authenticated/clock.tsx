import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/_authenticated/clock")({
  head: () => ({ meta: [{ title: "Clock — Untangle" }] }),
  component: ClockPage,
});

function ClockPage() {
  const [phase, setPhase] = useState<"work" | "break">("work");
  const [secsLeft, setSecsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [label, setLabel] = useState("");
  const [bodyDouble, setBodyDouble] = useState("");
  const tickRef = useRef<number | null>(null);
  const secsRef = useRef(25 * 60);
  const phaseRef = useRef<"work" | "break">("work");

  function stop() { if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; } }
  function start() {
    stop();
    tickRef.current = window.setInterval(() => {
      secsRef.current -= 1;
      if (secsRef.current <= 0) {
        stop();
        const next = phaseRef.current === "work" ? "break" : "work";
        const ns = next === "work" ? 25 * 60 : 5 * 60;
        phaseRef.current = next; secsRef.current = ns;
        setPhase(next); setSecsLeft(ns); setRunning(false);
      } else setSecsLeft(secsRef.current);
    }, 1000);
  }
  useEffect(() => () => stop(), []);

  const toggle = () => { if (running) { stop(); setRunning(false); } else { start(); setRunning(true); } };
  const reset = () => { stop(); setRunning(false); const s = phase === "work" ? 25 * 60 : 5 * 60; secsRef.current = s; setSecsLeft(s); };
  const switchPhase = (p: "work" | "break") => {
    stop(); setRunning(false);
    const s = p === "work" ? 25 * 60 : 5 * 60;
    phaseRef.current = p; secsRef.current = s; setPhase(p); setSecsLeft(s);
  };

  const total = phase === "work" ? 25 * 60 : 5 * 60;
  // DEPLETING ring — shows how much time REMAINS, not how much has passed
  const remaining = secsLeft / total;
  const R = 96; const circ = 2 * Math.PI * R;

  // Color shifts as urgency builds — mirrors the ADHD brain map
  // Calm navy → amber (5 min warning) → red (2 min critical)
  const getColor = () => {
    if (phase === "break") return "#1A8A4A";
    if (secsLeft <= 2 * 60) return "#C0392B";   // red — critical
    if (secsLeft <= 5 * 60) return "#C87D0E";   // amber — warning
    return "#1A2744";                            // navy — calm focus
  };
  const col = getColor();

  const mm = String(Math.floor(secsLeft / 60)).padStart(2, "0");
  const ss = String(secsLeft % 60).padStart(2, "0");

  const urgencyLabel = () => {
    if (phase === "break") return "rest";
    if (secsLeft <= 2 * 60) return "finish now";
    if (secsLeft <= 5 * 60) return "wrapping up";
    return "minutes of focus";
  };

  return (
    <div className="flex flex-col items-center gap-7 py-8">
      <div className="text-[10px] tracking-[4px] uppercase text-muted-foreground">
        {phase === "work" ? "Focus block" : "Break time"}
      </div>

      <div className="relative" style={{ width: 220, height: 220 }}>
        <svg width={220} height={220} style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle cx={110} cy={110} r={R} fill="none" stroke="#EDE7DE" strokeWidth={7} />
          {/* Depleting arc — shrinks as time runs out */}
          <circle
            cx={110} cy={110} r={R} fill="none" stroke={col} strokeWidth={7}
            strokeDasharray={`${circ * remaining} ${circ}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.9s linear, stroke 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-serif" style={{ fontSize: 50, color: col, lineHeight: 1, transition: "color 1s ease" }}>
            {mm}:{ss}
          </div>
          <div className="text-[10px] tracking-[2px] text-muted-foreground mt-1.5">
            {urgencyLabel()}
          </div>
        </div>
      </div>

      {/* What are you working on */}
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="what are you working on?"
        className="border-b border-border bg-transparent outline-none font-mono text-xs text-center py-1 w-64"
      />

      {/* Body double field — naming someone makes the brain think it's being watched */}
      <div className="flex flex-col items-center gap-1">
        <input
          value={bodyDouble}
          onChange={(e) => setBodyDouble(e.target.value)}
          placeholder="working alongside (body double)..."
          className="border-b border-border bg-transparent outline-none font-mono text-[11px] text-center py-1 w-64 text-muted-foreground"
        />
        {bodyDouble && (
          <p className="text-[10px] tracking-[1px] text-muted-foreground/60 italic">
            {bodyDouble} is working too.
          </p>
        )}
      </div>

      <div className="flex gap-2.5">
        <button
          onClick={toggle}
          className="px-7 py-3 text-[10px] tracking-[2px] uppercase text-white transition-colors"
          style={{ background: running ? "#F0EAE0" : col, color: running ? "#555" : "white" }}
        >
          {running ? "Pause" : "Start"}
        </button>
        <button onClick={reset} className="px-5 py-3 text-[10px] tracking-[2px] uppercase border border-border text-muted-foreground">
          Reset
        </button>
      </div>

      <div className="flex gap-2">
        {([ ["Focus 25", "work"], ["Break 5", "break"] ] as const).map(([lbl, p]) => (
          <button key={p} onClick={() => switchPhase(p)}
            className="px-4 py-1.5 text-[9px] tracking-[2px] uppercase border"
            style={{ borderColor: phase === p ? col : "#E0D8CE", background: phase === p ? col : "transparent", color: phase === p ? "white" : "#888" }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* ADHD reminder — only when running */}
      {running && phase === "work" && (
        <p className="text-[10px] tracking-[2px] uppercase text-muted-foreground/50 text-center max-w-xs">
          One task. Not your inbox. Not a quick check. Just this.
        </p>
      )}
    </div>
  );
}
