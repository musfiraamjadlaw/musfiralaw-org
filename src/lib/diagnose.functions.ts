import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SYSTEM = `You are a translator between lived experience and cognitive neuroscience. The user speaks in feelings. You respond with mechanisms, evidence, and one precise action.

The user does not need to understand neuroscience. You do. Translate plainly.

Map every input to one or more of these six cognitive systems:
- Executive Function (planning, sequencing, inhibition, switching) — prefrontal cortex, dopamine
- Working Memory (holding and manipulating information) — dorsolateral PFC, parietal cortex
- Attention Regulation (sustaining, filtering, orienting) — frontoparietal & cingulo-opercular networks, norepinephrine
- Cognitive Load (total in-flight demand) — capacity limits across PFC + WM systems
- Motivation / Activation (initiating, energizing action) — mesolimbic dopamine, ventral striatum
- Decision-Making (evaluating, choosing under uncertainty) — vmPFC, OFC, anterior cingulate

No therapy talk. No flattery. No moralizing. No emojis. Calm, precise, peer-level voice.

Respond ONLY with valid JSON. No markdown fences. No preamble.`;

async function callAI(prompt: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`AI error: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export type CognitiveSystem =
  | "Executive Function"
  | "Working Memory"
  | "Attention Regulation"
  | "Cognitive Load"
  | "Motivation / Activation"
  | "Decision-Making";

export type DiagnoseResult = {
  echo: string; // one-sentence restatement of what the user said
  systems: Array<{
    name: CognitiveSystem;
    load: "high" | "medium" | "low";
    note: string;
  }>;
  primary_system: CognitiveSystem;
  plain_explanation: string; // step 2 — simple language
  neuroscience: string; // step 3 — brief mechanism w/ brain regions
  intervention: {
    action: string;
    duration: string;
    why_it_works: string;
  };
  article: {
    id: string;
    title: string;
    url: string | null;
    why: string;
  } | null;
  book: { title: string; author: string; why: string };
  study: {
    title: string;
    authors: string;
    year: string;
    finding: string;
    citation: string;
  };
  question: string;
};

export const diagnose = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { input: string }) =>
    z.object({ input: z.string().min(1).max(4000) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<DiagnoseResult> => {
    const { supabase } = context;

    const { data: articles } = await supabase
      .from("articles")
      .select("id, title, url, summary, themes, content_text")
      .order("published_at", { ascending: false })
      .limit(40);

    const articleCorpus = (articles ?? [])
      .map(
        (a) =>
          `ID: ${a.id}\nTITLE: ${a.title}\nURL: ${a.url ?? ""}\nTHEMES: ${(a.themes ?? []).join(", ")}\nSUMMARY: ${
            a.summary ?? (a.content_text ?? "").slice(0, 400)
          }`,
      )
      .join("\n---\n");

    const prompt = `THE USER SAID:
"""
${data.input}
"""

USER'S OWN ARTICLES (recommend at most ONE, only if it truly fits — never invent):
${articleCorpus || "(none)"}

Return JSON with this exact shape:
{
  "echo": "One sentence restating what the user is experiencing, in their register.",
  "systems": [
    { "name": "Executive Function | Working Memory | Attention Regulation | Cognitive Load | Motivation / Activation | Decision-Making",
      "load": "high|medium|low",
      "note": "One short sentence on how this system is implicated." }
  ],
  "primary_system": "the single most-struggling system from the list above",
  "plain_explanation": "2-3 sentences in plain language explaining what cognitive system is struggling and why. No jargon. No brain regions yet.",
  "neuroscience": "2-4 sentences with the underlying mechanism. Name relevant brain regions and neurotransmitters (e.g. prefrontal cortex, dopamine, locus coeruleus, anterior cingulate). Keep it accurate and readable.",
  "intervention": {
    "action": "ONE concrete, specific intervention the user can do right now. Not a list.",
    "duration": "e.g. '90 seconds', '10 minutes', 'before the next task'",
    "why_it_works": "1-2 sentences linking the action to the mechanism above."
  },
  "article": null OR { "id": "exact id from list", "title": "exact title", "url": "exact url or empty string", "why": "Why this piece of the user's own writing connects." },
  "book": { "title": "", "author": "", "why": "One sentence." },
  "study": {
    "title": "",
    "authors": "",
    "year": "",
    "finding": "2-3 sentences on the relevant finding.",
    "citation": "APA-style citation."
  },
  "question": "One sharp question for the user to sit with."
}

RULES:
- 1 to 3 entries in "systems". Pick what is actually implicated. Order by load.
- The book and study must be real and accurately cited.
- "article" is null if nothing in the list genuinely fits.
- No emojis. No bullet lists inside string values. No therapy register.`;

    const raw = await callAI(prompt);
    const parsed = parseJson<DiagnoseResult>(raw);

    if (parsed.article) {
      const validIds = new Set((articles ?? []).map((a) => a.id));
      if (!validIds.has(parsed.article.id)) parsed.article = null;
    }

    return parsed;
  });
