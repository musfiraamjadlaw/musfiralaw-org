import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SYSTEM = `You are a private cognitive navigator — part strategist, part researcher, part developmental editor, part librarian. The user shares what is on their mind. You respond with calm, precise structure. No therapy talk. No flattery. No emojis. No checklists. Speak as a peer who reads widely and thinks clearly.

Your job is to diagnose what is really happening, identify the missing activation ingredient, name one clear next action, and connect the situation to ideas worth thinking with.

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

export type DiagnoseResult = {
  pattern: string; // "What is this really about?"
  diagnosis: {
    summary: string;
    friction: string;
    core_problem: string;
  };
  activation: {
    interest: "high" | "medium" | "low";
    challenge: "high" | "medium" | "low";
    urgency: "high" | "medium" | "low";
    novelty: "high" | "medium" | "low";
    relationships: "high" | "medium" | "low";
    meaning: "high" | "medium" | "low";
    missing: string;
    explanation: string;
  };
  action: {
    next_step: string;
    why: string;
  };
  related_thinking: string;
  articles: Array<{
    id: string;
    title: string;
    url: string | null;
    relevance: string;
    connecting_idea: string;
    why_read: string;
  }>;
  fuel: {
    book: { title: string; author: string; why: string };
    study: { title: string; authors: string; year: string; summary: string; citation: string };
    question: string;
  };
};

export const diagnose = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { input: string }) =>
    z.object({ input: z.string().min(1).max(4000) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<DiagnoseResult> => {
    const { supabase } = context;

    const [{ data: articles }, { data: knowledge }, { data: notes }, { data: court }] =
      await Promise.all([
        supabase
          .from("articles")
          .select("id, title, url, summary, themes, content_text")
          .order("published_at", { ascending: false })
          .limit(40),
        supabase.from("knowledge_entries").select("title, category, body").limit(30),
        supabase.from("notes").select("text").limit(30),
        supabase.from("courtroom_entries").select("situation, verdict").limit(15),
      ]);

    const articleCorpus = (articles ?? [])
      .map(
        (a) =>
          `ID: ${a.id}\nTITLE: ${a.title}\nURL: ${a.url ?? ""}\nTHEMES: ${(a.themes ?? []).join(", ")}\nSUMMARY: ${
            a.summary ?? (a.content_text ?? "").slice(0, 400)
          }`,
      )
      .join("\n---\n");

    const knowledgeCorpus = (knowledge ?? [])
      .map((k) => `[${k.category}] ${k.title}: ${(k.body ?? "").slice(0, 300)}`)
      .join("\n");

    const noteCorpus = (notes ?? []).map((n) => `- ${n.text}`).join("\n");
    const courtCorpus = (court ?? [])
      .map((c) => `Q: ${c.situation}\nA: ${c.verdict ?? ""}`)
      .join("\n---\n");

    const prompt = `THE USER'S INPUT:
"""
${data.input}
"""

THE USER'S WRITTEN ARTICLES (use ONLY these — never invent articles):
${articleCorpus || "(none yet)"}

KNOWLEDGE VAULT ENTRIES:
${knowledgeCorpus || "(none)"}

NOTES & OBSERVATIONS:
${noteCorpus || "(none)"}

COURTROOM REASONING:
${courtCorpus || "(none)"}

Produce a JSON object with this exact shape:
{
  "pattern": "Single sentence naming what this is really about (e.g. 'Overwhelm → Cognitive overload').",
  "diagnosis": {
    "summary": "What is likely happening cognitively. 2-3 sentences.",
    "friction": "What is creating friction. 1-2 sentences.",
    "core_problem": "The core problem in one sentence."
  },
  "activation": {
    "interest": "high|medium|low",
    "challenge": "high|medium|low",
    "urgency": "high|medium|low",
    "novelty": "high|medium|low",
    "relationships": "high|medium|low",
    "meaning": "high|medium|low",
    "missing": "Name the single missing ingredient.",
    "explanation": "One sentence: execution is failing because X is missing."
  },
  "action": {
    "next_step": "ONE concrete action. Not a checklist. Not multiple options.",
    "why": "One sentence justifying why this is the right entry point."
  },
  "related_thinking": "2-4 sentences connecting this problem to broader ideas from the user's knowledge vault, notes, or reasoning above. Cite specific entries when present.",
  "articles": [
    {
      "id": "exact article ID from the list above",
      "title": "exact title",
      "url": "exact url or empty string",
      "relevance": "Why this article is relevant to the user's current input.",
      "connecting_idea": "The specific idea inside the article that connects to the problem.",
      "why_read": "Why the user should re-read it now."
    }
  ],
  "fuel": {
    "book": { "title": "", "author": "", "why": "One sentence on why it matters here." },
    "study": {
      "title": "",
      "authors": "",
      "year": "",
      "summary": "2-3 sentences on the finding.",
      "citation": "APA-style citation."
    },
    "question": "One sharp question the user should sit with."
  }
}

RULES:
- Recommend ONLY articles from the list above. Use their exact IDs. Max 3, minimum 0 if none truly fit.
- Never fabricate the user's articles.
- The book and study may come from your general knowledge but must be real and accurately cited.
- No emojis. No moralizing. No therapy register. No bullet lists inside string values.`;

    const raw = await callAI(prompt);
    const parsed = parseJson<DiagnoseResult>(raw);

    // Filter article IDs to ones that actually exist
    const validIds = new Set((articles ?? []).map((a) => a.id));
    parsed.articles = (parsed.articles ?? []).filter((a) => validIds.has(a.id)).slice(0, 3);

    return parsed;
  });
