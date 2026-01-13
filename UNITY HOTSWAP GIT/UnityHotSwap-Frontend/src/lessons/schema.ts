export type Difficulty = "beginner" | "intermediate" | "advanced";

export type LessonMeta = {
  id: number;
  title: string;
  subtitle?: string;
  difficulty?: Difficulty;
  /** Ścieżka do pliku .md serwowanego przez Vite (np. /src/lessons/lesson1.md) */
  mdPath: string;
  /** Folder Build z Unity WebGL (np. /public/unity/lesson1/Build). Gdy brak - nie ma praktyki. */
  scenePath?: string;
};
