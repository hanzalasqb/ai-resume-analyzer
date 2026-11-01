// Import the library entry directly to skip pdf-parse's debug self-test on import.
// @ts-expect-error - no bundled types for the internal path
import pdf from "pdf-parse/lib/pdf-parse.js";

export async function extractResumeText(file: Express.Multer.File): Promise<string> {
  if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
    const out = await pdf(file.buffer);
    return out.text as string;
  }
  if (file.mimetype.startsWith("text/") || /\.(txt|md)$/i.test(file.originalname)) {
    return file.buffer.toString("utf8");
  }
  throw new Error("Unsupported file type. Upload a PDF or TXT resume.");
}
