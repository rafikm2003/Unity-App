import React, { useEffect, useRef, useState } from "react";

type UnityInstance = any;

declare global {
  interface Window {
    createUnityInstance?: (canvas: HTMLCanvasElement, config: any) => Promise<UnityInstance>;
    webglInputCaptureAllKeyboardInput: false;
    unityInstance?: UnityInstance;
    unityReady?: boolean;
    __unityReadyListeners?: Array<() => void>;
  }
}

function buildNameForLesson(lessonId: string): string {
  return `lesson${lessonId}`;
}

export default function UnityPlayer({ lessonId }: { lessonId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    let destroyed = false;

    const base = `/unity/lesson${lessonId}/Build/`;
    const v = `?v=${Date.now()}`;

    const primaryBuildName = buildNameForLesson(lessonId);

    const tryLoad = (buildName: string) => {
      const loaderUrl = `${base}${buildName}.loader.js${v}`;
      const config = {
        dataUrl: `${base}${buildName}.data${v}`,
        frameworkUrl: `${base}${buildName}.framework.js${v}`,
        codeUrl: `${base}${buildName}.wasm${v}`,
        streamingAssetsUrl: "StreamingAssets",
        companyName: "UnityEdu",
        productName: `Lesson${lessonId}`,
        productVersion: "1.0",
      };

      const script = document.createElement("script");
      script.src = loaderUrl;

      script.onload = () => {
        if (!window.createUnityInstance || !canvasRef.current) {
          setErr("Brak createUnityInstance lub canvasu");
          setStatus("error");
          return;
        }

        canvasRef.current.setAttribute("tabindex", "-1");

        window
          .createUnityInstance(canvasRef.current, config)
          .then((inst: UnityInstance) => {
            if (destroyed) {
              try {
                inst.Quit();
              } catch {}
              return;
            }
            window.unityInstance = inst;
            window.unityReady = true;
            (window.__unityReadyListeners || []).forEach((cb) => cb());
            setStatus("ready");
          })
          .catch((e: any) => {
            throw e;
          });
      };

      script.onerror = () => {
        const error = new Error(`Nie wczytano loadera JS: ${loaderUrl}`);
        (error as any).__loaderFailed = true;
        throw error;
      };

      document.body.appendChild(script);

      return script;
    };

    setStatus("loading");
    setErr("");

    let currentScript: HTMLScriptElement | null = null;

    const run = async () => {
      try {
        currentScript = tryLoad(primaryBuildName);
      } catch {
      }

      setTimeout(() => {
        if (destroyed) return;
        if (window.unityInstance) return;

        try {
          if (currentScript?.parentNode) currentScript.parentNode.removeChild(currentScript);
        } catch {}

        try {
          currentScript = tryLoad("UnityBuild");
        } catch {}
      }, 800);
    };

    run();

    const hardTimeout = setTimeout(() => {
      if (destroyed) return;
      if (window.unityInstance) return;

      setStatus("error");
      setErr(
        `Unity nie wstało. Sprawdź czy istnieją pliki: ${base}${primaryBuildName}.loader.js/.data/.framework.js/.wasm (lub fallback UnityBuild.*).`
      );
    }, 12000);

    return () => {
      destroyed = true;
      clearTimeout(hardTimeout);

      try {
        if (currentScript?.parentNode) currentScript.parentNode.removeChild(currentScript);
      } catch {}

      try {
        window.unityInstance?.Quit?.();
      } catch {}

      window.unityInstance = undefined;
      window.unityReady = false;
    };
  }, [lessonId]);

  return (
    <div style={{ width: "100%", height: "520px", background: "#000", borderRadius: 12, position: "relative", zIndex: 1 }}>
      <canvas id="unity-canvas" ref={canvasRef} style={{ width: "100%", height: "100%" }} />
      {status !== "ready" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: "#9ca3af",
            fontSize: 14,
            padding: "0 16px",
            textAlign: "center",
          }}
        >
          {status === "loading" ? (
            "Ładowanie Unity…"
          ) : (
            <>
              <div style={{ marginBottom: 8 }}>Błąd ładowania Unity.</div>
              <div style={{ fontSize: 12, color: "#bbb" }}>
                Oczekiwany build: <code>lesson{lessonId}.*</code> w <code>/public/unity/lesson{lessonId}/Build/</code>
              </div>
              {err && <div style={{ marginTop: 8, fontSize: 12, color: "#f88" }}>{err}</div>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
