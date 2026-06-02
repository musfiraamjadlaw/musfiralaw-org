import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============================================================
// UNTANGLE — Sensemaking engine with Activation Framework
// as the operating logic.
//
// Chain: Observation → Core Question → Mechanism (interpreted
// through six activation conditions: Interest, Challenge,
// Urgency, Novelty, Relationships, Meaning) → Your Writing →
// Research → Book → Better Question → Action (emerging from
// the missing condition) → Suggested Intervention.
// ============================================================

const SYSTEM = `You are the sensemaking engine inside Untangle. You sit at the intersection of a developmental editor, a cognitive neuroscientist, a strategist, a researcher, and a mentor.

Your job is to help the user move from DESCRIPTION to EXPLANATION.

THE ACTIVATION FRAMEWORK is your operating logic. When action is difficult, one or more of these six conditions is usually missing:
- Interest — the task is dull, abstract, or doesn't pull attention. (Wave)
- Challenge — the task is too easy, too hard, or mis-calibrated to current ability. (Warning Triangle)
- Urgency — the deadline is invisible, distant, or self-imposed without teeth. (Clock)
- Novelty — the task is repetitive, predictable, or stale. (Expiration Marker)
- Relationships — no one else is involved, watching, collaborating, or counting on it. (Connected Nodes)
- Meaning — the task is disconnected from anything the person actually cares about. (Compass)

You do not present this as a scorecard. You interpret. The framework should feel like a lens, not a feature.

PERSONALIZATION RULE — read carefully:
You may be given a PATTERNS block summarizing the user's prior Untangle cases, recurring themes in their writing, and their library. Use it ONLY to recognize recurrences — repeated missing conditions, recurring questions, themes they return to. Reference them observationally, like a research assistant tracking a case ("Urgency has appeared as the missing condition in several prior analyses"; "This resembles questions you've explored in your writing about ambition and validation").

DO NOT imitate the user's voice, tone, vocabulary, sentence rhythm, or style. DO NOT try to sound like them. DO NOT quote their writing back at them. You are personalizing through UNDERSTANDING, not through PERFORMANCE. Stay in your own register: clear, scientific, editorial.

PRINCIPLES:
- Prioritize the deeper QUESTION beneath the observation. The user's work is driven by recurring questions, not topics.
- Translate research into clear, human language. Never clinical. Never textbook. Never therapy-speak.
- Cite real authors, real studies, real books. Be accurate.
- No flattery. No moralizing. No emojis. No bullet lists inside string values.
- The user should leave with more clarity than they arrived with.

Respond ONLY with valid JSON. No markdown fences. No preamble.`;

async function callAI(prompt: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
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

export type ActivationCondition =
  | "Interest"
  | "Challenge"
  | "Urgency"
  | "Novelty"
  | "Relationships"
  | "Meaning";

export type Intervention =
  | "brain_dump"
  | "courtroom"
  | "clock"
  | "meaning"
  | "states"
  | "none";

export type DiagnoseResult = {
  observation_echo: string;
  core_question: string;
  question_context: string;
  mechanism: {
    plain: string;
    deeper: string;
    activation_reading: string;
    missing_condition: ActivationCondition;
    present_conditions: ActivationCondition[];
    citations: string[];
  };
  article: {
    id: string;
    title: string;
    url: string | null;
    question_it_explores: string;
    why_relevant: string;
    insight: string;
  } | null;
  study: {
    title: string;
    authors: string;
    year: string;
    finding: string;
    why_it_deepens: string;
    citation: string;
  };
  book: {
    title: string;
    author: string;
    why: string;
  };
  better_question: string;
  action: {
    step: string;
    why_this_emerges: string;
  };
  suggested_intervention: {
    kind: Intervention;
    label: string;
    reason: string;
  };
  pattern_notes: string[];
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
      .limit(60);

    const articleCorpus = (articles ?? [])
      .map(
        (a) =>
          `ID: ${a.id}\nTITLE: ${a.title}\nURL: ${a.url ?? ""}\nTHEMES: ${(a.themes ?? []).join(", ")}\nSUMMARY: ${
            a.summary ?? (a.content_text ?? "").slice(0, 500)
          }`,
      )
      .join("\n---\n");

    const prompt = `THE USER WROTE:
"""
${data.input}
"""

THE USER'S OWN WRITING (their Substack corpus — match by IDEA, not keyword; recommend at most ONE; pick null if nothing genuinely fits):
${articleCorpus || "(none)"}

Build the intellectual chain. Return JSON with this exact shape:

{
  "observation_echo": "One sentence restating what the user said, in their register. Just show you heard them.",

  "core_question": "The deeper QUESTION beneath the observation. A real question ending in '?'. Not a topic. e.g. 'Why does overwhelm make action harder?' or 'What am I protecting by avoiding this?'",

  "question_context": "2-3 sentences explaining why this is the real question underneath, not the surface one.",

  "mechanism": {
    "plain": "2-3 sentences in clear human language explaining what may be happening cognitively or behaviorally. No jargon yet. The kind of explanation a thoughtful friend who happens to be a scientist would give.",
    "deeper": "2-4 sentences with the underlying mechanism. You may name relevant systems (executive function, dopamine, prediction error, loss aversion, etc.) but keep it readable. Translate, don't lecture.",
    "activation_reading": "2-3 sentences interpreting the situation through the Activation Framework. Name which conditions appear present and which appear missing or weak, in plain prose, not as a list. e.g. 'Meaning is strong here — the user clearly cares. Urgency is absent: the deadline is internal and the cost of delay is invisible. Relationships are missing too — no one else is in this with them.' Do NOT use the words 'scorecard' or 'high/low'. Interpret, don't grade.",
    "missing_condition": "Interest | Challenge | Urgency | Novelty | Relationships | Meaning  — the SINGLE most consequential missing condition.",
    "present_conditions": ["array of the conditions that appear present or strong"],
    "citations": ["1-3 short inline references to real researchers or frameworks, e.g. 'Kahneman, Thinking Fast and Slow' or 'Barkley on executive function'."]
  },

  "article": null OR {
    "id": "exact id from list",
    "title": "exact title",
    "url": "exact url or empty string",
    "question_it_explores": "The question this piece was actually wrestling with.",
    "why_relevant": "Why this connects to what the user is sitting with now. Match by idea, not keyword.",
    "insight": "What from this piece may help here. One sentence."
  },

  "study": {
    "title": "Real study title",
    "authors": "Real authors",
    "year": "YYYY",
    "finding": "2-3 sentences on the relevant finding.",
    "why_it_deepens": "One sentence on why this study sharpens the mechanism above.",
    "citation": "APA-style citation."
  },

  "book": {
    "title": "Real book",
    "author": "Real author",
    "why": "1-2 sentences. Prioritize books that help the user THINK DIFFERENTLY about the core question."
  },

  "better_question": "A genuine intellectual question worth sitting with. Not a journaling prompt. Not self-help.",

  "action": {
    "step": "ONE meaningful next step that EMERGES DIRECTLY from the missing activation condition. e.g. missing Urgency → 'Set a deadline that someone else will see by Friday.' Missing Relationships → 'Send the half-formed version to one person today.' Missing Challenge → 'Reduce the task to the single hardest sub-step and do only that.' Missing Meaning → 'Write one sentence about why this matters before opening the file.' Missing Interest → 'Change the input — read the most provocative thing about this problem before returning to it.' Missing Novelty → 'Do this in a different room, format, or order than usual.'",
    "why_this_emerges": "1-2 sentences linking the action back to the missing condition. So the user sees why THIS action, not a generic one."
  },

  "suggested_intervention": {
    "kind": "brain_dump | courtroom | clock | meaning | states | none",
    "label": "Plain-English label for the intervention.",
    "reason": "One sentence on why this tool fits the diagnosis."
  }
}

INTERVENTION ROUTING (pick the one that fits, or "none"):
- brain_dump → overwhelm, too many in-flight items, can't see the surface (Cognitive Load high)
- courtroom → decision-making under uncertainty, weighing options, can't choose
- clock → task initiation failure where Urgency is the missing condition
- meaning → the question is about purpose, identity, or why this matters at all (Meaning missing)
- states → recurring pattern where the user wants to investigate what reliably works or fails for them
- none → the chain itself is the intervention; no tool is needed

RULES:
- "article" is null if nothing in the corpus genuinely fits the IDEA (not the keywords).
- Book and study must be real and accurately cited.
- No emojis. No therapy register. No flattery.
- Help the user move from description to explanation.`;

    const raw = await callAI(prompt);
    const parsed = parseJson<DiagnoseResult>(raw);

    if (parsed.article) {
      const validIds = new Set((articles ?? []).map((a) => a.id));
      if (!validIds.has(parsed.article.id)) parsed.article = null;
    }

    return parsed;
  });

// Re-export for backward compatibility with the Editorial sensemaking section
export type SensemakeResult = DiagnoseResult;
export const sensemake = diagnose;
