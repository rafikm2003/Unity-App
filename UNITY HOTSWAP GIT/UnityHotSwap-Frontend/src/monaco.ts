import * as monaco from "monaco-editor";

/**
 * Monaco worker configuration for Vite (module workers).
 * This must run once before the editor is created.
 */
(self as any).MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === "json") {
      return new Worker(
        new URL("monaco-editor/esm/vs/language/json/json.worker", import.meta.url),
        { type: "module" }
      );
    }
    if (label === "css" || label === "scss" || label === "less") {
      return new Worker(
        new URL("monaco-editor/esm/vs/language/css/css.worker", import.meta.url),
        { type: "module" }
      );
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return new Worker(
        new URL("monaco-editor/esm/vs/language/html/html.worker", import.meta.url),
        { type: "module" }
      );
    }
    if (label === "typescript" || label === "javascript") {
      return new Worker(
        new URL("monaco-editor/esm/vs/language/typescript/ts.worker", import.meta.url),
        { type: "module" }
      );
    }
    return new Worker(
      new URL("monaco-editor/esm/vs/editor/editor.worker", import.meta.url),
      { type: "module" }
    );
  },
};

/**
 * C# language registration.
 *
 * If C# isn't registered, Monaco falls back to plain text and everything looks "grey".
 * This file ensures `language="csharp"` tokenizes and gets IDE-like coloring.
 */
const hasCSharp = monaco.languages.getLanguages().some((l) => l.id === "csharp");

if (!hasCSharp) {
  monaco.languages.register({ id: "csharp" });

  // Minimal Monarch tokenizer for C# used in this project.
  monaco.languages.setMonarchTokensProvider("csharp", {
    tokenizer: {
      root: [
        [
          /\b(class|public|private|protected|internal|static|void|using|return|if|else|new|for|foreach|while|do|switch|case|break|continue|true|false|null|ref|out|in|var|int|float|double|bool|string|struct|interface|namespace|try|catch|finally|throw)\b/,
          "keyword",
        ],
        [/\b(int|float|double|bool|string|var)\b/, "type"],
        [/\b([A-Z][\w\$]*)\b/, "type.identifier"],
        [/\b([a-z_][\w\$]*)\b/, "identifier"],
        [/[{}()\[\]]/, "@brackets"],
        [/[;,.]/, "delimiter"],
        [/\d+\.\d+([eE][\-\+]?\d+)?[fFdDmM]?/, "number.float"],
        [/\d+([eE][\-\+]?\d+)?[uUlL]*/, "number"],
        [/@"([^"]|"")*"/, "string"],
        [/"([^"\\]|\\.)*"/, "string"],
        [/\/\/.*$/, "comment"],
        [/\/\*/, "comment", "@comment"],
      ],
      comment: [
        [/[^\/\*]+/, "comment"],
        [/\*\//, "comment", "@pop"],
        [/([\/\*])/, "comment"],
      ],
    },
  });
}

export default monaco;
