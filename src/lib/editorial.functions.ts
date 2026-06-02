import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { XMLParser } from "fast-xml-parser";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- helpers ----------

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function callAI(prompt: string, wantJson = true): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
  const system =
    "You are an experienced developmental editor. You analyze a writer's body of work and surface themes, gaps, and what to write next. You speak like a senior editor at a literary magazine: precise, observational, never flattering. You never invent facts about the writer's life. You stay grounded strictly in the text provided." +
    (wantJson ? " Respond ONLY with valid JSON. No markdown fences. No preamble." : "");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`AI error: ${res.status} ${await res.text()}`);
  const json = await res.json();
  const text: string = json.choices?.[0]?.message?.content?.trim() ?? "";
  return text;
}

function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

// ---------- Substack source management ----------

export const addSubstackSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      feedUrl: z.string().url().max(500),
      publicationName: z.string().max(200).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("substack_sources").upsert(
      { user_id: userId, feed_url: data.feedUrl, publication_name: data.publicationName ?? null },
      { onConflict: "user_id,feed_url" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeSubstackSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("substack_sources").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- RSS sync ----------

export const syncSubstack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: sources, error: srcErr } = await supabase
      .from("substack_sources")
      .select("*");
    if (srcErr) throw new Error(srcErr.message);
    if (!sources?.length) return { imported: 0, sources: 0 };

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      cdataPropName: "__cdata",
      textNodeName: "#text",
    });

    let imported = 0;
    for (const src of sources) {
      try {
        const res = await fetch(src.feed_url, {
          headers: { "User-Agent": "Mozilla/5.0 (Editorial Intelligence)" },
        });
        if (!res.ok) continue;
        const xml = await res.text();
        const parsed = parser.parse(xml);
        const channel = parsed?.rss?.channel;
        if (!channel) continue;

        // publication name fallback
        if (!src.publication_name && channel.title) {
          await supabase
            .from("substack_sources")
            .update({ publication_name: String(channel.title) })
            .eq("id", src.id);
        }

        const items = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];
        for (const item of items) {
          const get = (v: any): string => {
            if (v == null) return "";
            if (typeof v === "string") return v;
            if (typeof v === "object") return v.__cdata ?? v["#text"] ?? "";
            return String(v);
          };
          const title = get(item.title);
          const link = get(item.link);
          const guidRaw = item.guid;
          const guid = typeof guidRaw === "object" ? get(guidRaw["#text"]) || link : get(guidRaw) || link;
          const pubDate = get(item.pubDate);
          const html =
            get(item["content:encoded"]) ||
            get(item.description) ||
            "";
          const categories = Array.isArray(item.category)
            ? item.category.map((c: any) => get(c)).filter(Boolean)
            : item.category
            ? [get(item.category)].filter(Boolean)
            : [];

          if (!title || !guid) continue;
          const text = stripHtml(html);
          const { error: upErr } = await supabase.from("articles").upsert(
            {
              user_id: userId,
              source: "published",
              title,
              url: link || null,
              guid,
              published_at: pubDate ? new Date(pubDate).toISOString() : null,
              content_text: text,
              content_html: html,
              tags: categories,
            },
            { onConflict: "user_id,guid" },
          );
          if (!upErr) imported++;
        }
        await supabase
          .from("substack_sources")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("id", src.id);
      } catch (e) {
        console.error("Sync failed for", src.feed_url, e);
      }
    }
    return { imported, sources: sources.length };
  });

// ---------- Manual entry ----------

export const addManualArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      title: z.string().min(1).max(500),
      content: z.string().min(1).max(200000),
      source: z.enum(["draft", "note", "fragment", "published"]),
      tags: z.array(z.string().max(60)).max(20).optional(),
      url: z.string().url().max(500).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("articles").insert({
      user_id: userId,
      source: data.source,
      title: data.title,
      url: data.url ?? null,
      content_text: data.content,
      tags: data.tags ?? [],
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Writing DNA ----------

export const analyzeWritingDNA = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: articles, error } = await supabase
      .from("articles")
      .select("id, title, content_text, published_at, source, tags")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(80);
    if (error) throw new Error(error.message);
    if (!articles?.length) throw new Error("No articles to analyze yet. Add a Substack feed or paste a draft first.");

    const corpus = articles
      .map(
        (a, i) =>
          `### Article ${i + 1} — ${a.title} [${a.source}${a.published_at ? ", " + a.published_at.slice(0, 10) : ""}]\n${a.content_text.slice(0, 3500)}`,
      )
      .join("\n\n");

    const raw = await callAI(
      `Below is the writer's corpus (${articles.length} pieces). Analyze it as a developmental editor would.\n\nReturn JSON:\n{\n  "themes": [\n    { "name": "short canonical name (1-3 words)", "description": "one sentence on what this theme means in THIS writer's work", "frequency": <int, articles it appears in>, "status": "core" | "recurring" | "emerging" }\n  ],\n  "obsessions": [ "intellectual obsession in 2-6 words", ... up to 5 ],\n  "questions": [ "a question the writer keeps asking (verbatim or close)", ... up to 5 ]\n}\n\nRules: themes max 12. Use status='core' for the 2-3 deepest, 'recurring' for steady mid-frequency, 'emerging' for newer ones appearing only in the most recent pieces. Be precise, not generic. No therapy language. No flattery.\n\nCORPUS:\n${corpus}`,
    );
    const parsed = parseJson<{
      themes: { name: string; description: string; frequency: number; status: string }[];
      obsessions: string[];
      questions: string[];
    }>(raw);

    // Replace themes
    await supabase.from("writing_themes").delete().eq("user_id", userId);
    const now = new Date().toISOString();
    if (parsed.themes?.length) {
      const rows = parsed.themes.slice(0, 12).map((t) => ({
        user_id: userId,
        name: t.name.slice(0, 80),
        description: t.description?.slice(0, 500) ?? null,
        frequency: Math.max(1, Math.min(999, t.frequency || 1)),
        status: ["core", "recurring", "emerging"].includes(t.status) ? t.status : "recurring",
        last_seen_at: now,
      }));
      const { error: insErr } = await supabase.from("writing_themes").insert(rows);
      if (insErr) throw new Error(insErr.message);
    }

    // Tag each article with the theme names it most likely belongs to (lightweight: simple substring match on themes in title+text)
    const themeNames = (parsed.themes || []).map((t) => t.name);
    for (const a of articles) {
      const hay = `${a.title}\n${a.content_text}`.toLowerCase();
      const hits = themeNames.filter((n) => hay.includes(n.toLowerCase())).slice(0, 6);
      if (hits.length) {
        await supabase.from("articles").update({ themes: hits }).eq("id", a.id);
      }
    }

    return {
      themes: parsed.themes,
      obsessions: parsed.obsessions ?? [],
      questions: parsed.questions ?? [],
      analyzed: articles.length,
    };
  });

// ---------- Article recommendations ----------

export const recommendNextArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [
      { data: themes },
      { data: articles },
      { data: threads },
      { data: notes },
      { data: knowledge },
      { data: court },
      { data: mentors },
    ] = await Promise.all([
      supabase.from("writing_themes").select("*").order("frequency", { ascending: false }),
      supabase
        .from("articles")
        .select("id, title, published_at, source, themes, content_text")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(40),
      supabase.from("unfinished_threads").select("topic, question, evidence, sources, mentions_count").eq("status", "open").limit(30),
      supabase.from("notes").select("text, category, created_at").order("created_at", { ascending: false }).limit(150),
      supabase.from("knowledge_entries").select("title, body, category, tags").order("created_at", { ascending: false }).limit(120),
      supabase.from("courtroom_entries").select("situation, facts, assumptions, verdict").order("created_at", { ascending: false }).limit(40),
      supabase.from("mentor_lessons").select("mentor_name, role, lesson, tags").order("created_at", { ascending: false }).limit(60),
    ]);

    const totalSignal =
      (articles?.length ?? 0) +
      (notes?.length ?? 0) +
      (knowledge?.length ?? 0) +
      (court?.length ?? 0) +
      (mentors?.length ?? 0);
    if (totalSignal === 0) {
      throw new Error("Nothing to analyze yet. Add notes, vault entries, courtroom analyses, or import articles first.");
    }

    const themeSummary = (themes ?? [])
      .map((t: any) => `- [${t.status}] ${t.name} (×${t.frequency}): ${t.description ?? ""}`)
      .join("\n");
    const articleSummary = (articles ?? [])
      .map((a: any) => `- ${a.id} | ${a.title} [${a.source}${a.published_at ? ", " + a.published_at.slice(0, 10) : ""}] — themes: ${(a.themes || []).join(", ") || "—"}`)
      .join("\n");
    const threadSummary = (threads ?? [])
      .map((t: any) => `- ${t.topic}${t.question ? " — " + t.question : ""}${t.evidence ? " | evidence: " + String(t.evidence).slice(0, 200) : ""} (×${t.mentions_count ?? 1}, sources: ${(t.sources || []).join(",")})`)
      .join("\n");
    const notesSummary = (notes ?? [])
      .map((n: any) => `- [${n.category ?? "note"}] ${String(n.text).slice(0, 240)}`)
      .join("\n")
      .slice(0, 12000);
    const knowledgeSummary = (knowledge ?? [])
      .map((k: any) => `### ${k.title} [${k.category}]${k.tags?.length ? " {" + k.tags.join(", ") + "}" : ""}\n${String(k.body || "").slice(0, 900)}`)
      .join("\n\n")
      .slice(0, 18000);
    const courtSummary = (court ?? [])
      .map((c: any) => `- Q: ${String(c.situation || "").slice(0, 300)}\n  Facts: ${String(c.facts || "").slice(0, 200)}\n  Assumptions: ${String(c.assumptions || "").slice(0, 200)}\n  Conclusion: ${String(c.verdict || "").slice(0, 300)}`)
      .join("\n\n")
      .slice(0, 10000);
    const mentorSummary = (mentors ?? [])
      .map((m: any) => `- ${m.mentor_name}${m.role ? " (" + m.role + ")" : ""}: ${String(m.lesson).slice(0, 300)}`)
      .join("\n")
      .slice(0, 6000);

    const raw = await callAI(
      `You are a developmental editor advising the writer on the most interesting articles they are uniquely positioned to write next.

The goal is NOT "recommend articles similar to past articles." The goal is to find articles that emerge from the INTERSECTION of the writer's entire knowledge ecosystem — notes, brain dumps, vault research, courtroom reasoning, lessons, and prior writing.

Privilege ideas that:
- Recur across MULTIPLE sources (e.g. a question that surfaces in notes AND in courtroom reasoning AND in vault research)
- Sit at the intersection of two or more themes that have not been combined yet
- Are unfinished threads — questions the writer keeps returning to without resolving
- The writer has unusual standing to write (specific evidence in their own material) and has not already covered in a published piece

Propose 3 candidates, ranked. For EACH:
- title (sharp, publishable headline, 4-10 words)
- rationale (2-3 sentences: why THIS writer is uniquely positioned to write THIS, citing what in the ecosystem points to it — name the sources)
- gap (one sentence: the unresolved tension or unanswered question it addresses)
- outline (3-6 bullet beats joined with " | ")
- connects_to (article IDs from ARTICLES ALREADY WRITTEN this would build on, max 4)
- themes (theme names from WRITING DNA, max 4)
- score (0-100, your confidence this is genuinely the next move — not just a plausible topic)

Return JSON: { "recommendations": [...] }

Do not invent facts about the writer. Stay grounded strictly in the material below.

WRITING DNA:
${themeSummary || "(none yet)"}

UNFINISHED THREADS:
${threadSummary || "(none yet)"}

NOTES & BRAIN DUMPS:
${notesSummary || "(none)"}

KNOWLEDGE VAULT (notes, research, ideas, lessons, references):
${knowledgeSummary || "(none)"}

COURTROOM REASONING (decisions, facts vs assumptions):
${courtSummary || "(none)"}

LESSONS / OBSERVATIONS:
${mentorSummary || "(none)"}

ARTICLES ALREADY WRITTEN:
${articleSummary || "(none)"}`,
    );
    const parsed = parseJson<{
      recommendations: {
        title: string;
        rationale: string;
        gap: string;
        outline: string;
        connects_to: string[];
        themes: string[];
        score: number;
      }[];
    }>(raw);

    const validIds = new Set((articles ?? []).map((a: any) => a.id));
    const rows = (parsed.recommendations ?? []).slice(0, 5).map((r) => ({
      user_id: userId,
      title: r.title.slice(0, 300),
      rationale: r.rationale.slice(0, 1500),
      gap: r.gap?.slice(0, 600) ?? null,
      outline: r.outline?.slice(0, 2000) ?? null,
      connects_to: (r.connects_to ?? []).filter((id) => validIds.has(id)).slice(0, 6),
      themes: (r.themes ?? []).slice(0, 6),
      score: typeof r.score === "number" ? r.score : null,
    }));
    if (rows.length) {
      const { error } = await supabase.from("article_recommendations").insert(rows);
      if (error) throw new Error(error.message);
    }
    return { created: rows.length };
  });

export const setRecommendationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["open", "dismissed", "drafted", "published"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("article_recommendations")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Idea detector + unfinished threads ----------

export const scanForThreads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [
      { data: notes },
      { data: knowledge },
      { data: court },
      { data: articles },
    ] = await Promise.all([
      supabase.from("notes").select("text, created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("knowledge_entries").select("title, body, tags, created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("courtroom_entries").select("situation, verdict, created_at").order("created_at", { ascending: false }).limit(80),
      supabase.from("articles").select("title, themes, source, published_at").order("published_at", { ascending: false, nullsFirst: false }).limit(60),
    ]);

    const blob = [
      "## NOTES & BRAIN DUMPS",
      (notes ?? []).map((n: any) => `- ${n.text}`).join("\n"),
      "\n## KNOWLEDGE VAULT",
      (knowledge ?? []).map((k: any) => `### ${k.title}\n${k.body?.slice(0, 1200) ?? ""}`).join("\n\n"),
      "\n## COURTROOM REASONING",
      (court ?? []).map((c: any) => `- Situation: ${c.situation?.slice(0, 400) ?? ""}\n  Conclusion: ${c.verdict?.slice(0, 400) ?? ""}`).join("\n"),
      "\n## ARTICLES ALREADY WRITTEN",
      (articles ?? []).map((a: any) => `- ${a.title} [${a.source}] — ${(a.themes || []).join(", ")}`).join("\n"),
    ].join("\n").slice(0, 60000);

    const raw = await callAI(
      `Scan this material as a developmental editor. Find ideas and questions that appear repeatedly across the writer's notes, research, and reasoning but have NOT been turned into a published article yet.\n\nReturn JSON:\n{\n  "ideas": [\n    { "topic": "short topic name (2-6 words)", "evidence": "what shows up repeatedly — 1-2 sentences quoting or paraphrasing", "mentions": <int>, "sources": ["notes","knowledge","courtroom"] (which sources it appears in) }\n  ],\n  "threads": [\n    { "topic": "short topic", "question": "the question the writer keeps circling (verbatim if possible)", "evidence": "1-2 sentences", "mentions": <int>, "sources": [...] }\n  ]\n}\n\nMax 8 ideas and 8 threads. Ignore one-off mentions. Skip anything already covered by an existing article above.\n\nMATERIAL:\n${blob}`,
    );
    const parsed = parseJson<{
      ideas: { topic: string; evidence: string; mentions: number; sources: string[] }[];
      threads: { topic: string; question: string; evidence: string; mentions: number; sources: string[] }[];
    }>(raw);

    // Replace open threads (keep dismissed/resolved)
    await supabase.from("unfinished_threads").delete().eq("user_id", userId).eq("status", "open");
    const now = new Date().toISOString();
    const threadRows = (parsed.threads ?? []).slice(0, 12).map((t) => ({
      user_id: userId,
      topic: t.topic.slice(0, 200),
      question: t.question?.slice(0, 500) ?? null,
      evidence: t.evidence?.slice(0, 1000) ?? null,
      mentions_count: Math.max(1, t.mentions || 1),
      sources: (t.sources ?? []).slice(0, 8),
      last_seen_at: now,
    }));
    if (threadRows.length) {
      const { error } = await supabase.from("unfinished_threads").insert(threadRows);
      if (error) throw new Error(error.message);
    }

    return { ideas: parsed.ideas ?? [], threadsCreated: threadRows.length };
  });

export const setThreadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), status: z.enum(["open", "dismissed", "resolved"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("unfinished_threads")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
