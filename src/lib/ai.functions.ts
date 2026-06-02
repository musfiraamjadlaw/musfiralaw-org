import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SYSTEM = `You are the reasoning engine inside Notebook — an executive function and decision-making tool for serious thinkers.

YOUR PURPOSE:
- Help the user start difficult tasks
- Break large projects into executable steps
- Separate facts from assumptions
- Organize knowledge for retrieval
- Clarify why work matters

YOUR TONE: Direct. Short sentences. No fluff. No therapy talk. No personal flattery. Treat the user as a competent professional who needs clear thinking, not emotional support. Never reference biography, identity, or relationships. Stay focused on the task in front of you.`;

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
