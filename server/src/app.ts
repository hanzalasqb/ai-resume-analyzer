import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import multer from "multer";
import { ZodError } from "zod";
import { analyzeResume } from "./analyzer.js";
import type { LLMClient } from "./llm.js";
import { extractResumeText } from "./parse.js";
import { AnalyzeBody } from "./schema.js";

export function createApp(llm: LLMClient, opts: { corsOrigin: string; maxUploadMb: number }) {
  const app = express();
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: opts.maxUploadMb * 1024 * 1024 } });

  app.use(helmet());
  app.use(cors({ origin: opts.corsOrigin }));
  app.use(express.json({ limit: "1mb" }));
  app.use("/api/", rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: "draft-7", legacyHeaders: false }));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.post("/api/analyze", upload.single("resume"), async (req, res, next) => {
    try {
      const body = AnalyzeBody.parse(req.body);
      const resume = req.file ? await extractResumeText(req.file) : body.resumeText;
      if (!resume || resume.trim().length < 50) {
        return res.status(400).json({ error: "Provide a resume file or at least 50 characters of resume text" });
      }
      res.json(await analyzeResume(llm, resume, body.jobDescription));
    } catch (e) {
      next(e);
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) return res.status(400).json({ error: err.errors[0]?.message ?? "Invalid input" });
    if (err instanceof multer.MulterError) return res.status(413).json({ error: err.message });
    const message = err instanceof Error ? err.message : "Internal error";
    const status = message.startsWith("Unsupported") ? 415 : 502;
    res.status(status).json({ error: message });
  });

  return app;
}
