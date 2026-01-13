/**
 * Mapowanie: id lekcji -> baza ścieżek builda Unity WebGL
 *
 * Struktura w /public powinna wyglądać tak:
 *
 * public/
 *   unity/
 *     lesson1/
 *       Build/
 *         UnityBuild.loader.js
 *         UnityBuild.framework.js
 *         UnityBuild.data
 *         UnityBuild.wasm
 *     lesson2/
 *       Build/ ... (analogicznie)
 *     lesson3/
 *       Build/ ...
 *     lesson4/
 *       Build/ ...
 *
 * Jeśli pliki mają inne nazwy (np. wygenerowane Wbg123...), możesz je ujednolicić
 * zmieniając nazwy na powyższe - wtedy kod poniżej działa bez zmian.
 */

export function getUnityBuildBase(lessonId: string): string | null {
  const map: Record<string, string> = {
    '1': '/unity/lesson1/Build',
    '2': '/unity/lesson2/Build',
    '3': '/unity/lesson3/Build',
    '4': '/unity/lesson4/Build',
  }
  return map[lessonId] ?? null
}

/** Przydatne ścieżki z base */
export function getUnityUrls(base: string) {
  return {
    loaderUrl: `${base}/UnityBuild.loader.js`,
    config: {
      dataUrl: `${base}/UnityBuild.data`,
      frameworkUrl: `${base}/UnityBuild.framework.js`,
      codeUrl: `${base}/UnityBuild.wasm`,
      streamingAssetsUrl: "StreamingAssets",
      companyName: "UnityEdu",
      productName: "LessonScene",
      productVersion: "1.0"
    }
  }
}
