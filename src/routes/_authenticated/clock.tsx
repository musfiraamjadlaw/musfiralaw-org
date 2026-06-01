import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/_authenticated/clock")({
  head: () => ({ meta: [{ title: "Clock — MusfiraOS" }] }),
  component: ClockPage,
});

function ClockPage() {
  const [phase, setPhase] = useState<"work" | "break">("work");
  const [secsLeft, setSecsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [label, setLabel] = useState("");
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
  const switchPhase = (p: "work" | "break") => { stop(); setRunning(false); const s = p === "work" ? 25 * 60 : 5 * 60; phaseRef.current = p; secsRef.current = s; setPhase(p); setSecsLeft(s); };

  const total = phase === "work" ? 25 * 60 : 5 * 60;
  const progress = Math.max(0, (total - secsLeft) / total);
  const R = 96; const circ = 2 * Math.PI * R;
  const col = phase === "work" ? "#1A2744" : "#1A8A4A";
  const mm = String(Math.floor(secsLeft / 60)).padStart(2, "0");
  const ss = String(secsLeft % 60).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-7 py-8">
      <div className="text-[10px] tracking-[4px] uppercase text-muted-foreground">
        {phase === "work" ? "Focus block" : "Break time"}
      </div>
      <div className="relative" style={{ width: 220, height: 220 }}>
        <svg width={220} height={220} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={110} cy={110} r={R} fill="none" stroke="#EDE7DE" strokeWidth={7} />
          <circle cx={110} cy={110} r={R} fill="none" stroke={col} strokeWidth={7}
            strokeDasharray={`${circ * progress} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.9s linear" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-serif" style={{ fontSize: 50, color: col, lineHeight: 1 }}>{mm}:{ss}</div>
          <div className="text-[10px] tracking-[2px] text-muted-foreground mt-1.5">
            {phase === "work" ? "minutes of focus" : "minutes of rest"}
          </div>
        </div>
      </div>
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="what are you working on?"
        className="border-b border-border bg-transparent outline-none font-mono text-xs text-center py-1 w-56" />
      <div className="flex gap-2.5">
        <button onClick={toggle} className="px-7 py-3 text-[10px] tracking-[2px] uppercase text-white" style={{ background: running ? "#F0EAE0" : col, color: running ? "#555" : "white" }}>
          {running ? "Pause" : "Start"}
        </button>
        <button onClick={reset} className="px-5 py-3 text-[10px] tracking-[2px] uppercase border border-border text-muted-foreground">Reset</button>
      </div>
      <div className="flex gap-2">
        {([["Focus 25", "work"], ["Break 5", "break"]] as const).map(([lbl, p]) => (
          <button key={p} onClick={() => switchPhase(p)}
            className="px-4 py-1.5 text-[9px] tracking-[2px] uppercase border"
            style={{ borderColor: phase === p ? col : "#E0D8CE", background: phase === p ? col : "transparent", color: phase === p ? "white" : "#888" }}>
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
}
