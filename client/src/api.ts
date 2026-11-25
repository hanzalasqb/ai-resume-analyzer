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

import { analyzeDemo } from "./demo";

const BASE = import.meta.env.VITE_API_URL ?? "";
export const IS_DEMO = import.meta.env.VITE_DEMO === "true";

async function analyzeInBrowser(jobDescription: string, file: File | null, resumeText: string): Promise<Analysis> {
  let resume = resumeText;
  if (file) {
    if (!/\.(txt|md)$/i.test(file.name)) throw new Error("The live demo reads .txt resumes only. Paste the text, or run the full app for PDF parsing.");
    resume = await file.text();
  }
  if (jobDescription.trim().length < 50) throw new Error("Job description must be at least 50 characters");
  if (resume.trim().length < 50) throw new Error("Provide a resume file or at least 50 characters of resume text");
  await new Promise((r) => setTimeout(r, 400)); // let the loading state show
  return analyzeDemo(resume, jobDescription);
}

export async function analyze(jobDescription: string, file: File | null, resumeText: string): Promise<Analysis> {
  if (IS_DEMO) return analyzeInBrowser(jobDescription, file, resumeText);
  const fd = new FormData();
  fd.append("jobDescription", jobDescription);
  if (file) fd.append("resume", file);
  else fd.append("resumeText", resumeText);
  const r = await fetch(`${BASE}/api/analyze`, { method: "POST", body: fd });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? "Analysis failed");
  return data;
}
