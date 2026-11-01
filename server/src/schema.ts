import { z } from "zod";

/** Structured output contract the LLM must return. Validated with Zod before reaching the client. */
export const AnalysisSchema = z.object({
  candidateName: z.string().nullable(),
  matchScore: z.number().min(0).max(100),
  verdict: z.enum(["strong_fit", "good_fit", "partial_fit", "weak_fit"]),
  summary: z.string(),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  interviewQuestions: z.array(z.string()).max(8),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

export const AnalyzeBody = z.object({
  jobDescription: z.string().min(50, "Job description must be at least 50 characters").max(15000),
  resumeText: z.string().max(30000).optional(),
});

export type AnalysisResult = Analysis & {
  keywordScore: number;
  finalScore: number;
};
