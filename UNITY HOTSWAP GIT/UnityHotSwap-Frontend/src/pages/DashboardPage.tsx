import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api";
import ProgressBar from "../components/ProgressBar";

type ProgressResponse = {
  completed: boolean[];
  completedCount: number;
  total: number;
};

export default function DashboardPage() {
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const p = await apiGet<ProgressResponse>("/api/progress");
      setProgress(p);
    } catch (e: any) {
      setError(e?.message ?? "Error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setLesson(lessonId: number, completed: boolean) {
    try {
      const p = await apiPost<ProgressResponse>("/api/progress/set", { lessonId, completed });
      setProgress(p);
    } catch (e: any) {
      setError(e?.message ?? "Error");
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Dashboard</h2>

      {error && <p>{error}</p>}
      {!progress && !error && <p>Ładowanie…</p>}

      {progress && (
        <>
          <ProgressBar completedCount={progress.completedCount} total={progress.total} />

          <div style={{ display: "grid", gap: 8 }}>
            <strong>Lekcje (0–5)</strong>
            {Array.from({ length: 6 }).map((_, i) => (
              <label key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={!!progress.completed?.[i]}
                  onChange={(e) => setLesson(i, e.target.checked)}
                />
                Lekcja {i}
              </label>
            ))}
          </div>

          <button onClick={load} style={{ padding: 10 }}>
            Odśwież
          </button>
        </>
      )}
    </div>
  );
}
