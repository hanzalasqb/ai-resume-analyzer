import { useState } from "react";
import { analyze, type Analysis } from "./api";

const VERDICT: Record<Analysis["verdict"], string> = {
  strong_fit: "Strong fit", good_fit: "Good fit", partial_fit: "Partial fit", weak_fit: "Weak fit",
};

function List({ title, items, tone }: { title: string; items: string[]; tone?: string }) {
  if (!items.length) return null;
  return (
    <section className="card">
      <h3>{title}</h3>
      <ul className={tone}>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </section>
  );
}

export default function App() {
  const [job, setJob] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null);
    try { setResult(await analyze(job, file, text)); }
    catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <div className="page">
      <header>
        <h1>🎯 AI Resume Analyzer</h1>
        <p>Match a resume against any job description — score, skill gaps and interview prep in seconds.</p>
      </header>

      <form onSubmit={submit} className="card form">
        <label>Job description
          <textarea rows={8} value={job} onChange={(e) => setJob(e.target.value)} placeholder="Paste the job description…" required />
        </label>
        <label>Resume (PDF or TXT)
          <input type="file" accept=".pdf,.txt" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        {!file && (
          <label>…or paste resume text
            <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} />
          </label>
        )}
        <button disabled={loading || job.length < 50 || (!file && text.length < 50)}>
          {loading ? "Analyzing…" : "Analyze resume"}
        </button>
        {error && <p className="error">{error}</p>}
      </form>

      {result && (
        <div className="results">
          <section className="card score">
            <div className="ring" style={{ ["--p" as string]: result.finalScore }}><span>{result.finalScore}</span></div>
            <div>
              <h2>{result.candidateName ?? "Candidate"} · {VERDICT[result.verdict]}</h2>
              <p>{result.summary}</p>
              <small>AI score {result.matchScore} · keyword score {result.keywordScore} · blended 70/30</small>
            </div>
          </section>
          <div className="grid">
            <List title="✅ Matched skills" items={result.matchedSkills} tone="chips ok" />
            <List title="⚠️ Missing skills" items={result.missingSkills} tone="chips warn" />
            <List title="💪 Strengths" items={result.strengths} />
            <List title="✍️ Resume improvements" items={result.improvements} />
          </div>
          <List title="🎤 Suggested interview questions" items={result.interviewQuestions} />
        </div>
      )}
    </div>
  );
}
