/**
 * Deterministic keyword matcher used alongside the LLM score.
 * Blending both reduces LLM variance and makes scores explainable.
 */
const SKILLS = [
  "javascript", "typescript", "python", "java", "go", "rust", "c#", "php", "sql",
  "react", "next.js", "vue", "angular", "node.js", "express", "nestjs", "fastapi", "django", "flask",
  "tailwind", "redux", "graphql", "rest", "trpc", "grpc",
  "postgresql", "mysql", "mongodb", "redis", "prisma", "drizzle",
  "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "ci/cd", "github actions", "linux",
  "llm", "openai", "langchain", "rag", "embeddings", "vector database", "pytorch", "tensorflow",
  "machine learning", "nlp", "prompt engineering", "microservices", "system design", "testing", "jest", "vitest",
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function extractSkills(text: string): string[] {
  const t = text.toLowerCase();
  return SKILLS.filter((s) => new RegExp(`(^|[^a-z0-9])${escape(s)}($|[^a-z0-9])`).test(t));
}

export function keywordScore(resume: string, job: string): { score: number; matched: string[]; missing: string[] } {
  const required = extractSkills(job);
  if (required.length === 0) return { score: 50, matched: [], missing: [] };
  const have = new Set(extractSkills(resume));
  const matched = required.filter((s) => have.has(s));
  const missing = required.filter((s) => !have.has(s));
  return { score: Math.round((matched.length / required.length) * 100), matched, missing };
}
