export type Analysis = {
  candidateName: string | null;
  matchScore: number;
  keywordScore: number;
  finalScore: number;
  verdict: "strong_fit" | "good_fit" | "partial_fit" | "weak_fit";
  summary: string;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  improvements: string[];
  interviewQuestions: string[];
};

const BASE = import.meta.env.VITE_API_URL ?? "";

export async function analyze(jobDescription: string, file: File | null, resumeText: string): Promise<Analysis> {
  const fd = new FormData();
  fd.append("jobDescription", jobDescription);
  if (file) fd.append("resume", file);
  else fd.append("resumeText", resumeText);
  const r = await fetch(`${BASE}/api/analyze`, { method: "POST", body: fd });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? "Analysis failed");
  return data;
}
