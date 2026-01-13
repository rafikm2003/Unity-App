import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "./api";
import { useAuth } from "./auth";

type ProgressResponse = {
  completed: boolean[]; // 6 elementów: 0..5
  completedCount: number;
  total: number;
};

type ProgressState = {
  completed: Set<string>; // ids lekcji jako string ("0".."5")
  markDone: (lessonId: string) => Promise<void>;
  refresh: () => Promise<void>;
  completedCount: number;
  total: number;
  percent: number;
};

const ProgressCtx = createContext<ProgressState | null>(null);

function completedArrayToSet(arr: boolean[] | null | undefined): Set<string> {
  const s = new Set<string>();
  if (!arr) return s;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) s.add(String(i));
  }
  return s;
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [completedArr, setCompletedArr] = useState<boolean[]>(() => Array.from({ length: 6 }).map(() => false));
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [total, setTotal] = useState<number>(6);

  const applyProgress = (p: ProgressResponse | null | undefined) => {
    if (!p) return;

    const arr = Array.isArray(p.completed) ? p.completed : [];
    const safeTotal = Number.isFinite(p.total) ? p.total : 6;

    setCompletedArr(arr);
    setCompletedCount(Number.isFinite(p.completedCount) ? p.completedCount : arr.filter(Boolean).length);
    setTotal(safeTotal);
  };

  const refresh = async () => {
    if (!isAuthenticated) return;
    const p = await apiGet<ProgressResponse>("/api/progress");
    applyProgress(p);
  };

  const markDone = async (lessonId: string) => {
    if (!isAuthenticated) return;

    const n = Number(lessonId);
    if (!Number.isFinite(n) || n < 0 || n > 5) return;

    const p = await apiPost<ProgressResponse>("/api/progress/set", {
      lessonId: n,
      completed: true,
    });

    applyProgress(p);
  };

  useEffect(() => {
    if (isAuthenticated) {
      refresh().catch(() => {});
    } else {
      setCompletedArr(Array.from({ length: 6 }).map(() => false));
      setCompletedCount(0);
      setTotal(6);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    const handler = () => {
      refresh().catch(() => {});
    };
    window.addEventListener("unityedu:progress-refresh", handler);
    return () => window.removeEventListener("unityedu:progress-refresh", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const completed = useMemo(() => completedArrayToSet(completedArr), [completedArr]);
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const value = useMemo<ProgressState>(
    () => ({
      completed,
      markDone,
      refresh,
      completedCount,
      total,
      percent,
    }),
    [completed, completedCount, total, percent]
  );

  return <ProgressCtx.Provider value={value}>{children}</ProgressCtx.Provider>;
}

export function useProgress() {
  const v = useContext(ProgressCtx);
  if (!v) throw new Error("useProgress must be used within ProgressProvider");
  return v;
}

/**
 * Export dla App.tsx (import { ProgressBar } from './progress').
 */
export function ProgressBar() {
  const { percent } = useProgress();

  return (
    <div className="progress-wrap" aria-label={`Postęp: ${percent}%`}>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="progress-label">{percent}%</div>
    </div>
  );
}
