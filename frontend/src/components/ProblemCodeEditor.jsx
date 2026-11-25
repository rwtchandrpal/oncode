import React, { memo } from "react";
import Editor from "@monaco-editor/react";
// Bundled Monaco instead of the jsDelivr CDN (SEC-07); must run before the first <Editor> mounts.
import "../utils/monacoSetup";
import { Settings } from "lucide-react";

const ProblemCodeEditor = memo(({
  path,
  defaultValue,
  onCodeChange,
  selectedLanguage,
  setSelectedLanguage,
  fontSize,
  setFontSize,
  languages,
  fontSizes,
  handleEditorDidMount
}) => {
  const handleEditorWillMount = (monaco) => {
    monaco.editor.defineTheme('daisyui-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#00000000', // transparent
      },
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      
      <div className="flex items-center justify-between px-2 sm:px-4 h-12 bg-base-200 shrink-0 border-b border-base-content/10">
        
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          aria-label="Select programming language"
          className="select select-sm bg-base-100 border-base-content/20 text-base-content focus:outline-none focus:border-primary font-medium"
        >
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang === "cpp" ? "C++" : lang.charAt(0).toUpperCase() + lang.slice(1)}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Settings className="w-4 h-4 text-base-content/50" />
          <span className="text-xs text-base-content/60 font-medium hidden sm:inline">Font Size:</span>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            aria-label="Select editor font size"
            className="select select-sm bg-base-100 border-base-content/20 text-base-content focus:outline-none focus:border-primary"
          >
            {fontSizes.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 relative bg-base-300">
        <Editor
          height="100%"
          language={selectedLanguage === "cpp" ? "cpp" : selectedLanguage}
          theme="daisyui-dark"
          beforeMount={handleEditorWillMount}
          // One Monaco model per path (problem + language): switching language swaps models
          // instead of overwriting text, so each language keeps its own code and undo history (BUG-05).
          path={path}
          defaultValue={defaultValue}
          onChange={onCodeChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: fontSize,
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            automaticLayout: true,
            fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
          }}
        />
      </div>
      
    </div>
  );
});

ProblemCodeEditor.displayName = "ProblemCodeEditor";

export default ProblemCodeEditor;