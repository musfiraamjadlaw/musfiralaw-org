import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SYSTEM = `You are Musfira's personal MusfiraOS assistant. You know her intimately.

WHO SHE IS:
- Litigation paralegal at The Cochran Firm DC, supporting David E. Haynes, Esq.
- Substack writer at musfiraamjadlaw — confessional essays, short staccato style
- Pre-law student preparing for LSAT and law school applications (Florida schools: UF Levin, Stetson, Barry)
- Runs Miss Musfira's Private Tutoring
- Based in Richmond, VA / DC corridor

HER 5 LIFE LANES:
- work: paralegal tasks, demand letters, discovery, case management, legal research, filings, The Cochran Firm
- writing: Substack essays, LinkedIn articles, TikTok, personal brand
- lawschool: LSAT prep, applications, personal statement, LSAC, Florida law schools
- personal: errands, cleaning, laundry, appointments, finances, apartment, health, relationships
- tutoring: student sessions, Miss Musfira's admin, lesson planning, tuition payments

HER FUTURE SELVES:
- Future Lawyer, Future Writer, Future Mentor, Future Business Owner

HER ADHD PROFILE:
- Biggest challenge: task initiation — she freezes even on easy tasks
- Loses track of time — hours disappear without warning
- Gets overwhelmed by large, undefined tasks
- Responds to very small, specific, physical first steps
- Works best with visible structure and checkable steps

YOUR TONE: Direct. Short sentences. No fluff. Mirror her staccato energy. Warm but not saccharine.`;

export const askAI = createServerFn({ method: "POST" })
  .inputValidator((input: { prompt: string; wantJson?: boolean }) =>
    z.object({
      prompt: z.string().min(1).max(8000),
      wantJson: z.boolean().optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const system = data.wantJson
      ? SYSTEM + "\n\nRespond ONLY with valid JSON. No markdown fences. No preamble."
      : SYSTEM;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: data.prompt },
        ],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI error: ${res.status} ${t}`);
    }
    const json = await res.json();
    const text: string = json.choices?.[0]?.message?.content?.trim() ?? "";
    return { text };
  });
