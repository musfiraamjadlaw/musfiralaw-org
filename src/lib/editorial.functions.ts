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

    // Only the writer's PUBLISHED work. No tasks. No admin notes. No reminders.
    const { data: articles, error: artErr } = await supabase
      .from("articles")
      .select("id, title, url, published_at, content_text, themes")
      .eq("source", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(80);
    if (artErr) throw new Error(artErr.message);

    if (!articles?.length) {
      throw new Error(
        "No published essays to analyze yet. Sync your Substack so the editor has a body of work to read.",
      );
    }

    const corpus = articles
      .map(
        (a: any, i: number) =>
          `### Essay ${i + 1} — ID: ${a.id}\nTITLE: ${a.title}${a.published_at ? "\nPUBLISHED: " + a.published_at.slice(0, 10) : ""}\n\n${(a.content_text || "").slice(0, 5000)}`,
      )
      .join("\n\n---\n\n");

    const raw = await callAI(
      `You are a developmental editor who has read the writer's entire body of published work. You are NOT a content strategist. You are NOT recommending topics. You are NOT helping them produce more content.

Your job: identify the QUESTIONS this writer keeps returning to but has not fully answered.

Read the essays below. Look for:
- Questions the writer keeps circling across multiple pieces
- Tensions they have raised but not resolved
- Ideas they keep approaching from different angles without landing
- Arguments they have gestured at but not fully made
- Counterpositions they have not seriously engaged with

DO NOT use task lists, reminders, or administrative notes. There are none here. Only published essays.

Return JSON: { "recommendations": [ ... ] }

Produce 3-5 recommendations, ranked by how alive the question is in the work. For EACH:
{
  "question": "The deeper question the writer keeps returning to. A real question ending in '?'. Specific to THIS writer's preoccupations. Not generic.",
  "why_it_keeps_appearing": "2-4 sentences. Where exactly this question surfaces across the corpus. Quote or paraphrase 2-3 specific essays by title. Show the pattern.",
  "whats_missing": "2-4 sentences. The perspective, argument, counterposition, or tension the writer has not yet explored. Be specific about what is unsaid, dodged, or only half-said. A good developmental editor names the avoidance.",
  "related_essays": [ "exact essay IDs from the corpus, 2-5 of them, that exemplify the question" ],
  "suggested_essay": "One sentence describing the next essay worth writing that would advance the question — not 'an essay about X' but a sharp angle: what it would argue, what it would risk, what it would close.",
  "score": <int 0-100, how alive this question is>
}

RULES:
- Ground every claim in the corpus. Do not invent biography.
- No flattery. No therapy register. No content-marketing language.
- The point is NOT productivity. The point is helping the writer understand their own body of work.
- If a "question" is really just a topic, drop it. Only real intellectual questions.

CORPUS (${articles.length} published essays):
${corpus}`,
    );

    const parsed = parseJson<{
      recommendations: {
        question: string;
        why_it_keeps_appearing: string;
        whats_missing: string;
        related_essays: string[];
        suggested_essay: string;
        score: number;
      }[];
    }>(raw);

    const validIds = new Set(articles.map((a: any) => a.id));

    // Clear previous open recommendations so the surface stays current
    await supabase
      .from("article_recommendations")
      .delete()
      .eq("user_id", userId)
      .eq("status", "open");

    const rows = (parsed.recommendations ?? []).slice(0, 5).map((r) => ({
      user_id: userId,
      // Map the editor's output onto existing columns
      title: r.question.slice(0, 500), // legacy column reused for "Question"
      question: r.question.slice(0, 500),
      rationale: r.why_it_keeps_appearing.slice(0, 2000),
      gap: r.whats_missing.slice(0, 2000),
      suggested_essay: r.suggested_essay?.slice(0, 1000) ?? null,
      outline: null,
      connects_to: (r.related_essays ?? []).filter((id) => validIds.has(id)).slice(0, 6),
      themes: [],
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
