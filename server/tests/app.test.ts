import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { keywordScore } from "../src/keywords.js";
import type { LLMClient } from "../src/llm.js";

const JOB = "We are hiring a Full Stack Developer with React, TypeScript, Node.js, PostgreSQL, Docker and AWS experience.";
const RESUME = "Hanzala — Full stack engineer. Built apps with React, TypeScript and Node.js. Deployed services using Docker.";

const goodLLM: LLMClient = {
  async completeJSON() {
    return {
      candidateName: "Hanzala", matchScore: 80, verdict: "good_fit", summary: "Solid full stack profile.",
      matchedSkills: ["React"], missingSkills: [], strengths: ["Modern stack"],
      improvements: ["Add metrics"], interviewQuestions: ["Explain React reconciliation"],
    };
  },
};

let calls = 0;
const flakyLLM: LLMClient = {
  async completeJSON() {
    calls++;
    return calls === 1 ? { bad: true } : goodLLM.completeJSON("", "");
  },
};

const opts = { corsOrigin: "*", maxUploadMb: 5 };

describe("keywordScore", () => {
  it("finds matched and missing skills", () => {
    const r = keywordScore(RESUME, JOB);
    expect(r.matched).toEqual(expect.arrayContaining(["react", "typescript", "node.js", "docker"]));
    expect(r.missing).toEqual(expect.arrayContaining(["postgresql", "aws"]));
    expect(r.score).toBe(67);
  });
});

describe("POST /api/analyze", () => {
  it("returns blended analysis for text resume", async () => {
    const res = await request(createApp(goodLLM, opts)).post("/api/analyze").send({ jobDescription: JOB, resumeText: RESUME });
    expect(res.status).toBe(200);
    expect(res.body.finalScore).toBe(Math.round(80 * 0.7 + 67 * 0.3));
    expect(res.body.missingSkills).toContain("aws");
  });

  it("accepts a TXT file upload", async () => {
    const res = await request(createApp(goodLLM, opts))
      .post("/api/analyze")
      .field("jobDescription", JOB)
      .attach("resume", Buffer.from(RESUME), { filename: "cv.txt", contentType: "text/plain" });
    expect(res.status).toBe(200);
  });

  it("retries once on malformed LLM output", async () => {
    calls = 0;
    const res = await request(createApp(flakyLLM, opts)).post("/api/analyze").send({ jobDescription: JOB, resumeText: RESUME });
    expect(res.status).toBe(200);
    expect(calls).toBe(2);
  });

  it("validates input", async () => {
    const res = await request(createApp(goodLLM, opts)).post("/api/analyze").send({ jobDescription: "short" });
    expect(res.status).toBe(400);
  });

  it("rejects unsupported files", async () => {
    const res = await request(createApp(goodLLM, opts))
      .post("/api/analyze")
      .field("jobDescription", JOB)
      .attach("resume", Buffer.from("x"), { filename: "cv.png", contentType: "image/png" });
    expect(res.status).toBe(415);
  });
});
