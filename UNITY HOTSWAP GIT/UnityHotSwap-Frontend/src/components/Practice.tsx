import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MonacoEditor from "react-monaco-editor";

import UnityPlayer from "../UnityPlayer";
import { getLessonById } from "../lessons";
import { getPracticeConfig } from "../practiceConfig";
import { getStarterCode } from "../starterCode";

type TestsResponse = {
  passed: boolean;
  results: Array<{ name: string; passed: boolean; message: string }>;
};

type DiagDto = {
  id?: string;
  severity?: string;
  message?: string;
  line?: number | null;
  column?: number | null;
};

type SimResponse = {
  success: boolean;
  diagnostics?: DiagDto[];
  samples?: Array<{ step: number; t: number; dt: number; x: number; y: number }>;
};

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:5000";

declare global {
  interface Window {
    unityInstance?: any;
    unityReady?: boolean;
    __unityReadyListeners?: Array<() => void>;
  }
}

function pickTokenFromStorage(): string | null {
  const keys = ["token", "auth_token", "unityedu_token", "unityhotswap_token", "jwt", "access_token"];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v && v.length > 10) return v;
  }
  return null;
}

async function fetchJsonOrThrow(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) {
    let body = "";
    try {
      body = await res.text();
    } catch {}
    throw new Error(`HTTP ${res.status} (${res.statusText})${body ? ` - ${body}` : ""}`);
  }
  return res.json();
}

function waitForUnityReady(timeoutMs: number = 8000): Promise<any> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const tryResolve = () => {
      if (window.unityReady && window.unityInstance) {
        resolve(window.unityInstance);
        return true;
      }
      return false;
    };

    if (tryResolve()) return;

    const timer = setInterval(() => {
      if (tryResolve()) {
        clearInterval(timer);
        return;
      }
      if (Date.now() - startedAt > timeoutMs) {
        clearInterval(timer);
        reject(new Error("Unity not ready (timeout)"));
      }
    }, 100);
  });
}

function sendToUnity(gameObject: string, method: string, arg: string) {
  const inst = window.unityInstance;
  inst?.SendMessage?.(gameObject, method, arg);
}

function formatDiagnostics(diags: DiagDto[] | null | undefined): string {
  if (!diags || diags.length === 0) return "";

  const lines = diags.map((d) => {
    const sev = (d.severity ?? "Unknown").toUpperCase();
    const id = d.id ? ` ${d.id}` : "";
    const loc =
      typeof d.line === "number" && typeof d.column === "number"
        ? ` (linia ${d.line}, kolumna ${d.column})`
        : typeof d.line === "number"
        ? ` (linia ${d.line})`
        : "";
    const msg = d.message ?? "(brak treści błędu)";
    return `- ${sev}${id}${loc}: ${msg}`;
  });

  return ["Błędy kompilacji / diagnostyka:", ...lines].join("\n");
}

export default function Practice({ embed = false }: { embed?: boolean }) {
  const params = useParams();
  const location = useLocation();

  const lessonId = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return (
      (params as any).lessonId ??
      (params as any).id ??
      sp.get("lessonId") ??
      sp.get("lesson") ??
      "1"
    );
  }, [params, location.search]);

  const lesson = useMemo(() => getLessonById(String(lessonId)), [lessonId]);
  if (!lesson) return <Navigate to="/" />;

  const practiceCfg = useMemo(() => getPracticeConfig(String(lessonId)), [lessonId]);

  const [code, setCode] = useState<string>(getStarterCode(String(lessonId)));
  const [consoleText, setConsoleText] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [testResp, setTestResp] = useState<TestsResponse | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setCode(getStarterCode(String(lessonId)));
    setConsoleText("");
    setTestResp(null);
    setIsRunning(false);
    abortRef.current?.abort();
    abortRef.current = null;

    setTimeout(() => {
      try {
        editorRef.current?.focus?.();
      } catch {}
    }, 0);
  }, [lessonId]);

  const stop = async () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsRunning(false);

    try {
      await waitForUnityReady(1500);
      sendToUnity("LessonBridge", "StopRun", "");
      sendToUnity("LessonBridge", "ShowMessage", "Stop");
    } catch {}

    setConsoleText((p) => p + "\nPrzerwano.\n");
  };

  const run = async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsRunning(true);
    setConsoleText("Uruchamiam symulację (kompilacja/wstrzyknięcie)...\n");
    setTestResp(null);

    // stop poprzedni run, żeby nie mieszać
    try {
      await waitForUnityReady(1000);
      sendToUnity("LessonBridge", "StopRun", "");
      sendToUnity("LessonBridge", "ShowMessage", "Run: start");
    } catch {}

    const token = pickTokenFromStorage();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const sim: SimResponse = await fetchJsonOrThrow(`${API_BASE}/api/simulate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ code, steps: 240, dt: 1 / 60 }),
        signal: abortRef.current.signal,
      });

      if (!sim.success) {
        const diagText = formatDiagnostics(sim.diagnostics);
        setConsoleText((prev) => prev + "Symulacja: FAIL\n" + (diagText ? diagText + "\n" : ""));
        try {
          await waitForUnityReady(1500);
          sendToUnity("LessonBridge", "ShowMessage", "Symulacja: FAIL (sprawdź konsolę)");
          sendToUnity("LessonBridge", "StopRun", "");
        } catch {}
        return;
      }

      if (!sim.samples || sim.samples.length === 0) {
        const diagText = formatDiagnostics(sim.diagnostics);
        setConsoleText((prev) => prev + "Symulacja: brak próbek ruchu.\n" + (diagText ? diagText + "\n" : ""));
        try {
          await waitForUnityReady(1500);
          sendToUnity("LessonBridge", "ShowMessage", "Brak samples (sprawdź konsolę)");
          sendToUnity("LessonBridge", "StopRun", "");
        } catch {}
        return;
      }

      setConsoleText((prev) => prev + `Symulacja OK. samples=${sim.samples!.length}\n`);

      // 2) UNITY: zawsze uruchom, jeśli mamy samples
      await waitForUnityReady();
      sendToUnity("LessonBridge", "ApplySamplesJson", JSON.stringify({ samples: sim.samples }));
      sendToUnity("LessonBridge", "StartRun", "");
      sendToUnity("LessonBridge", "ShowMessage", `Injected: samples=${sim.samples.length}`);

      setConsoleText((prev) => prev + "Scena uruchomiona (samples wstrzyknięte).\n");

      // 3) TESTY: dopiero teraz walidacja (nie blokuje sceny)
      setConsoleText((prev) => prev + "Sprawdzam testy (po uruchomieniu sceny)...\n");

      const tests: TestsResponse = await fetchJsonOrThrow(`${API_BASE}/api/tests`, {
        method: "POST",
        headers,
        body: JSON.stringify({ lessonId: String(lessonId), code }),
        signal: abortRef.current.signal,
      });

      setTestResp(tests);

      if (tests.passed) {
        setConsoleText((prev) => prev + "Testy zaliczone ✅\n");
        // progress w DB dzieje się w /api/tests; my tylko odświeżamy UI
        window.dispatchEvent(new Event("unityedu:progress-refresh"));
        try {
          sendToUnity("LessonBridge", "ShowMessage", "Testy: OK");
        } catch {}
      } else {
        setConsoleText((prev) => prev + "Testy NIEzaliczone.\n");
        try {
          sendToUnity("LessonBridge", "ShowMessage", "Testy: FAIL (scena działa dalej)");
        } catch {}
      }
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setConsoleText((prev) => prev + `Błąd: ${e?.message ?? String(e)}\n`);
      try {
        await waitForUnityReady(1500);
        sendToUnity("LessonBridge", "ShowMessage", `Error (sprawdź konsolę)`);
      } catch {}
    } finally {
      setIsRunning(false);
    }
  };

  const onEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    try {
      editor.updateOptions({ readOnly: false, domReadOnly: false });
    } catch {}
  };

  return (
    <div className={`practice-grid ${embed ? "embed" : ""}`}>
      <div className="practice-scene">
        <UnityPlayer lessonId={String(lessonId)} />

        {practiceCfg ? (
          <div style={{ marginTop: 12 }}>
            <div className="label">Polecenie zadania</div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{practiceCfg.taskTitle}</div>
            <pre className="console" style={{ minHeight: 0 }}>
              {practiceCfg.taskDescription}
            </pre>
          </div>
        ) : null}
      </div>

      <div className="practice-panel">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ margin: 0 }}>{lesson.title}</h2>

          <div className="row" style={{ justifyContent: "flex-end", gap: 10 }}>
            <button className="btn primary" onClick={run} disabled={isRunning}>
              Uruchom
            </button>
            <button className="btn" onClick={stop} disabled={!isRunning}>
              Stop
            </button>
          </div>
        </div>

        {practiceCfg && (practiceCfg as any).markdown ? (
          <div className="md" style={{ marginTop: 12 }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{(practiceCfg as any).markdown}</ReactMarkdown>
          </div>
        ) : null}

        <div
          style={{
            marginTop: 12,
            border: "1px solid var(--line)",
            borderRadius: 12,
            overflow: "hidden",
            background: "#0b0d12",
          }}
          onMouseDown={() => {
            setTimeout(() => {
              try {
                editorRef.current?.focus?.();
              } catch {}
            }, 0);
          }}
        >
          <MonacoEditor
            height="360"
            language="csharp"
            theme="vs-dark"
            value={code}
            onChange={(v) => setCode(v ?? "")}
            editorDidMount={onEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              tabSize: 4,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              readOnly: false,
              domReadOnly: false,
            }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <div className="label">Konsola</div>
          <pre className="console">{consoleText || "Kliknij „Uruchom”, aby uruchomić symulację i wizualizację."}</pre>
        </div>

        <div style={{ marginTop: 12 }}>
          <div className="label">Testy (backend)</div>

          {testResp ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {testResp.results.map((r, idx) => (
                <li key={idx}>
                  <b>
                    {r.passed ? "✅" : "❌"} {r.name}
                  </b>{" "}
                  - {r.message}
                </li>
              ))}
            </ul>
          ) : (
            <div>Kliknij „Uruchom”, aby sprawdzić testy.</div>
          )}
        </div>

        <div style={{ opacity: 0.7, marginTop: 8, fontSize: 12 }}>API: {API_BASE}</div>
      </div>
    </div>
  );
}
