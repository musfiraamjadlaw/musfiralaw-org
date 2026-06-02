import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SYSTEM = `You are a sensemaking engine. You sit at the intersection of a developmental editor, a cognitive neuroscientist, a strategist, a researcher, and a mentor.

Your job is NOT to categorize, diagnose, or recommend content.
Your job is to help the user move from DESCRIPTION to EXPLANATION.

The user arrives with an observation about their own experience. You build an intellectual chain:
Observation → Core Question → Mechanism → Their own writing → Research → Book → A better question → One action.

PRINCIPLES:
- Prioritize QUESTIONS over themes. The user's work is driven by recurring questions, not recurring topics.
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

export type DiagnoseResult = {
  observation_echo: string;
  core_question: string;
  question_context: string;
  mechanism: {
    plain: string;
    deeper: string;
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
  "observation_echo": "One sentence that restates what the user said, in their register. Do not interpret yet. Just show you heard them.",

  "core_question": "The deeper QUESTION beneath the observation. Phrased as a real question ending in '?'. Not a theme. Not a topic. Something like 'Why does overwhelm make action harder?' or 'What am I protecting by avoiding this?'",

  "question_context": "2-3 sentences explaining why this is the question underneath. What makes it the real question, rather than the surface one.",

  "mechanism": {
    "plain": "2-3 sentences in clear human language explaining what may be happening. No jargon. No brain regions yet. The kind of explanation a thoughtful friend who happens to be a scientist would give.",
    "deeper": "2-4 sentences with the underlying cognitive/neuro/behavioral mechanism. You may name relevant systems (executive function, dopamine, anterior cingulate, prediction error, loss aversion, etc.) but keep it readable. Translate, don't lecture.",
    "citations": ["1-3 short inline references to researchers or frameworks, e.g. 'Kahneman, Thinking Fast and Slow' or 'Barkley on executive function'. Real names. Real work."]
  },

  "article": null OR {
    "id": "exact id from list",
    "title": "exact title",
    "url": "exact url or empty string",
    "question_it_explores": "The question this piece of writing was actually wrestling with.",
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
    "why": "1-2 sentences. Prioritize books that help the user THINK DIFFERENTLY about the core question, not books that 'cover the topic'."
  },

  "better_question": "A genuine intellectual question worth sitting with. Not a journaling prompt. Not self-help. Something like 'What assumption am I treating as fact?' or 'What would this look like if I viewed it as an experiment?'",

  "action": {
    "step": "ONE meaningful next step. Not a checklist. Not a productivity plan. Something that emerges naturally from the mechanism.",
    "why_this_emerges": "1-2 sentences linking the action back to the mechanism — so the user sees why THIS action, not a generic one."
  }
}

RULES:
- "article" is null if nothing in the corpus genuinely fits the IDEA (not the keywords).
- Book and study must be real and accurately cited.
- No emojis. No therapy register. No flattery. No "you've got this".
- Help the user move from description to explanation.`;

    const raw = await callAI(prompt);
    const parsed = parseJson<DiagnoseResult>(raw);

    if (parsed.article) {
      const validIds = new Set((articles ?? []).map((a) => a.id));
      if (!validIds.has(parsed.article.id)) parsed.article = null;
    }

    return parsed;
  });
