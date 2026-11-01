import "dotenv/config";
import { z } from "zod";

const Env = z.object({
  PORT: z.coerce.number().default(4000),
  LLM_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  LLM_API_KEY: z.string().default(""),
  LLM_MODEL: z.string().default("gpt-4o-mini"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  MAX_UPLOAD_MB: z.coerce.number().default(5),
});

export const config = Env.parse(process.env);
export type Config = typeof config;
