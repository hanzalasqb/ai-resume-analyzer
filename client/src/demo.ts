/**
 * Browser-only analysis used by the live demo (VITE_DEMO=true).
 * It reuses the server's deterministic keyword matcher and replaces the LLM
 * with transparent rules, so the demo needs no backend or API key.
 */
import { extractSkills, keywordScore } from "../../server/src/keywords";
import type { Analysis } from "./api";

const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

function guessName(resume: string): string | null {
  const first = resume.split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? "";
  return /^[A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+){1,3}$/.test(first) ? first : null;
}

function years(text: string): number | null {
  const all = [...text.matchAll(/(\d{1,2})\+?\s*(?:years?|yrs?)/gi)].map((m) => Number(m[1]));
  return all.length ? Math.max(...all) : null;
}

const has = (t: string, re: RegExp) => re.test(t);

export function analyzeDemo(resume: string, job: string): Analysis {
  const kw = keywordScore(resume, job);
  const resumeSkills = extractSkills(resume);
  const needYears = years(job);
  const haveYears = years(resume);
  const metrics = (resume.match(/\b\d+(?:\.\d+)?\s?(?:%|x|k|m|\+)(?=\W|$)/gi) ?? []).length;
  const sections = {
    experience: has(resume, /\b(experience|employment|work history)\b/i),
    projects: has(resume, /\bprojects?\b/i),
    education: has(resume, /\b(education|degree|university|bachelor|master)\b/i),
    summary: has(resume, /\b(summary|profile|objective|about)\b/i),
  };
  const wc = words(resume);

  // Rule-based stand-in for the LLM score: skills dominate, then seniority and resume quality.
  let score = kw.score * 0.6;
  if (needYears == null || (haveYears != null && haveYears >= needYears)) score += 15;
  else if (haveYears != null) score += Math.max(0, 15 - (needYears - haveYears) * 5);
  score += Math.min(metrics, 5) * 2;
  score += (Object.values(sections).filter(Boolean).length / 4) * 15;
  const matchScore = Math.max(0, Math.min(100, Math.round(score)));
  const finalScore = Math.round(matchScore * 0.7 + kw.score * 0.3);
  const verdict: Analysis["verdict"] =
    finalScore >= 80 ? "strong_fit" : finalScore >= 65 ? "good_fit" : finalScore >= 45 ? "partial_fit" : "weak_fit";

  const name = guessName(resume);
  const who = name ?? "The candidate";
  const summary =
    kw.matched.length + kw.missing.length === 0
      ? `${who}'s resume was compared with a job description that lists few recognizable technical skills, so the score leans on seniority and resume structure.`
      : `${who} covers ${kw.matched.length} of ${kw.matched.length + kw.missing.length} skills the role asks for` +
        (kw.missing.length ? `; the main gaps are ${kw.missing.slice(0, 3).join(", ")}.` : ", with no keyword gaps.") +
        (needYears != null ? ` The role asks for ${needYears}+ years and the resume shows ${haveYears ?? "no stated"} years.` : "");

  const strengths: string[] = [];
  if (kw.matched.length) strengths.push(`Directly relevant skills: ${kw.matched.slice(0, 6).join(", ")}`);
  const extra = resumeSkills.filter((s) => !kw.matched.includes(s));
  if (extra.length) strengths.push(`Additional skills beyond the brief: ${extra.slice(0, 5).join(", ")}`);
  if (metrics >= 2) strengths.push(`Uses ${metrics} quantified results, which makes impact easy to verify`);
  if (haveYears != null && needYears != null && haveYears >= needYears) strengths.push(`Meets the ${needYears}+ year experience requirement`);
  if (sections.projects) strengths.push("Includes a projects section that shows hands-on work");

  const improvements: string[] = [];
  for (const s of kw.missing.slice(0, 4)) improvements.push(`If you have used ${s}, add it with a concrete example (project, scope, result)`);
  if (metrics < 2) improvements.push("Add numbers to achievements, e.g. latency cut by 40%, 10k users served, 3 releases a month");
  if (!sections.summary) improvements.push("Add a 2–3 line summary at the top tailored to this role");
  if (!sections.projects) improvements.push("Add a projects section with links to live demos or repositories");
  if (wc > 900) improvements.push(`Trim the resume (${wc} words) to one or two pages; keep the most relevant roles`);
  if (wc < 100) improvements.push(`Expand the resume (${wc} words): describe responsibilities, tools and outcomes for each role`);

  const interviewQuestions = [
    ...kw.matched.slice(0, 3).map((s) => `Walk me through a production problem you solved with ${s}. What trade-offs did you make?`),
    ...kw.missing.slice(0, 2).map((s) => `This role uses ${s}. How would you get productive with it in your first month?`),
    "Tell me about a project you are proud of and how you measured its success.",
  ].slice(0, 6);

  return {
    candidateName: name,
    matchScore,
    keywordScore: kw.score,
    finalScore,
    verdict,
    summary,
    matchedSkills: kw.matched,
    missingSkills: kw.missing,
    strengths: strengths.length ? strengths : ["Clear, readable resume text"],
    improvements: improvements.length ? improvements : ["The resume already lines up well; tailor the summary to the company"],
    interviewQuestions,
  };
}

export const SAMPLE_JOB = `Senior Full Stack Engineer (AI products)

We are hiring a full stack engineer with 4+ years of experience to build AI features into our SaaS platform.
You will work with TypeScript, React and Node.js on the front end and back end, design REST and GraphQL APIs,
and ship LLM features using OpenAI, RAG and embeddings. Our data lives in PostgreSQL and Redis, and we deploy
with Docker, Kubernetes and GitHub Actions on AWS. Experience with testing (Jest or Vitest) and system design is required.`;

export const SAMPLE_RESUME = `Ayesha Khan
Full Stack Developer · Lahore, Pakistan

Summary
Full stack developer with 5 years of experience building React and Node.js products, recently focused on LLM features.

Experience
Software Engineer, Nimbus Labs (2022 - present)
- Built a RAG support assistant with OpenAI and embeddings that resolved 35% of tickets automatically
- Designed REST APIs in Node.js and Express with PostgreSQL; cut p95 latency by 40%
- Set up Docker and GitHub Actions pipelines; release cadence went from monthly to 3 releases a week

Frontend Developer, Pixelcraft (2020 - 2022)
- Shipped TypeScript and React dashboards used by 10k+ users; wrote Vitest unit tests

Projects
- DocuChat: chat-with-PDF app (FastAPI, React, vector database)

Education
BS Computer Science, University of the Punjab`;
