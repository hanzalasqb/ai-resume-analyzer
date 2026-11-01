import type { Config } from "./config.js";

export interface LLMClient {
  completeJSON(system: string, user: string): Promise<unknown>;
}

/** Minimal client for any OpenAI-compatible chat completions endpoint, using JSON mode. */
export class OpenAICompatibleClient implements LLMClient {
  constructor(private cfg: Pick<Config, "LLM_BASE_URL" | "LLM_API_KEY" | "LLM_MODEL">) {}

  async completeJSON(system: string, user: string): Promise<unknown> {
    const res = await fetch(`${this.cfg.LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.cfg.LLM_API_KEY}` },
      body: JSON.stringify({
        model: this.cfg.LLM_MODEL,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) throw new Error(`LLM request failed (${res.status})`);
    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    return JSON.parse(data.choices[0].message.content);
  }
}
