import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router";
import { Maximize2, Minimize2, Play, Send } from "lucide-react";
import axiosClient from "../../utils/axiosClient";

import GlobalNavbar from "../../components/GlobalNavbar";

// LEFT-PANE TABS
import ProblemDescription from "../../components/ProblemDescription";
import ProblemSolution from "../../components/ProblemSolution";
import ChatAI from "../../components/ProblemChatAI";
import ProblemSubmissions from "../../components/ProblemSubmissions";

// RIGHT-PANE TABS
import ProblemCodeEditor from "../../components/ProblemCodeEditor";
import ProblemTestcase from "../../components/ProblemTestcase";
import ProblemResult from "../../components/ProblemResult";
import { getApiErrorMessage } from '../../utils/apiError';

const DEFAULT_SPLIT_RATIO = 40;
const MIN_SPLIT_RATIO = 20;
const MAX_SPLIT_RATIO = 80;
const PLACEHOLDER_CODE = "// Write your code here...";

const ProblemWorkSpace = () => {
  let { problemId } = useParams();

  // --- Core State ---
  const [problem, setProblem] = useState(null);
  // null | "not-found" | "error"  (BUG-06: never spin forever)
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState("cpp");
  const [code, setCode] = useState(PLACEHOLDER_CODE);
  // Starter snippet per language, used as each Monaco model's initial value
  const [starterCodes, setStarterCodes] = useState({});
  
  // Changed loading to a string to track which button is spinning ('run' | 'submit' | null)
  const [loadingAction, setLoadingAction] = useState(null);
  
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  // --- Editor Settings State ---
  const [fontSize, setFontSize] = useState(16);

  // --- Tab State ---
  const [activeLeftTab, setActiveLeftTab] = useState("Description");
  const [activeRightTab, setActiveRightTab] = useState("Code");
  const [mobileView, setMobileView] = useState("problem"); // 'problem' | 'editor'

  // --- Fullscreen State ---
  const [isLeftFullScreen, setIsLeftFullScreen] = useState(false);
  const [isRightFullScreen, setIsRightFullScreen] = useState(false);

  const toggleLeftFullScreen = () => {
    setIsLeftFullScreen((prev) => !prev);
    setIsRightFullScreen(false);
  };

  const toggleRightFullScreen = () => {
    setIsRightFullScreen((prev) => !prev);
    setIsLeftFullScreen(false);
  };

  // --- Resizable Split-Pane State ---
  const [splitRatio, setSplitRatio] = useState(() => {
    const saved = localStorage.getItem("oncode_workspace_split");
    const parsed = saved ? parseFloat(saved) : DEFAULT_SPLIT_RATIO;
    return !isNaN(parsed) && parsed >= MIN_SPLIT_RATIO && parsed <= MAX_SPLIT_RATIO
      ? parsed
      : DEFAULT_SPLIT_RATIO;
  });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const splitRatioRef = useRef(splitRatio);

  const editorRef = useRef(null);
  const codeRef = useRef(PLACEHOLDER_CODE);
  const userCodesRef = useRef({});
  // Read by the editor change handler, so it never writes into the wrong language (BUG-05)
  const selectedLanguageRef = useRef("cpp");

  const leftTabs = ["Description", "Solution", "Submissions", "ChatAI"];
  const rightTabs = ["Code", "Testcase", "Result"];
  // Only the languages this problem has driver code for (BUG-10)
  const languages = problem?.codeSnippets?.length
    ? problem.codeSnippets.map((s) => s.language.toLowerCase())
    : ["cpp"];
  const fontSizes = [12, 14, 16, 18, 20, 24]; 

  // Fetch the problem
  useEffect(() => {
    let isMounted = true;
    const fetchProblem = async () => {
      setLoadError(null);
      try {
        const { data } = await axiosClient.get(`/problem/${problemId}`);
        if (!isMounted) return;
        setProblem(data.problem);
        if (data.problem && data.problem.codeSnippets) {
          const initialCodes = {};
          data.problem.codeSnippets.forEach(snippet => {
            initialCodes[snippet.language.toLowerCase()] = snippet.userSnippet;
          });
          userCodesRef.current = { ...initialCodes };
          setStarterCodes(initialCodes);
          // Default to the first language the problem supports
          const firstLanguage = data.problem.codeSnippets[0]?.language?.toLowerCase() || "cpp";
          const starterCode = initialCodes[firstLanguage] || PLACEHOLDER_CODE;
          codeRef.current = starterCode;
          setCode(starterCode);
          selectedLanguageRef.current = firstLanguage;
          setSelectedLanguage(firstLanguage);
        }
      } catch (err) {
        console.error("Failed to fetch problem", err);
        if (!isMounted) return;
        const status = err.response?.status;
        setLoadError(status === 400 || status === 404 ? "not-found" : "error");
      }
    };
    fetchProblem();
    return () => {
      isMounted = false;
    };
  }, [problemId, reloadKey]);

  // Keep code buffer in ref without triggering parent re-render on every keystroke
  const handleCodeChange = (newCode) => {
    codeRef.current = newCode || "";
    userCodesRef.current[selectedLanguageRef.current] = newCode || "";
  };

  const handleLanguageChange = (lang) => {
    // The editor swaps to the other language's model (see the path prop); nothing is overwritten.
    const nextCode = userCodesRef.current[lang] ?? starterCodes[lang] ?? PLACEHOLDER_CODE;
    selectedLanguageRef.current = lang;
    codeRef.current = nextCode;
    setSelectedLanguage(lang);
    setCode(nextCode);
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  // Ensure Monaco recalculates layout immediately when returning to the Code tab
  useEffect(() => {
    if (activeRightTab === "Code" && editorRef.current) {
      editorRef.current.layout();
    }
  }, [activeRightTab]);

  // --- Split-Pane Resizing Handlers ---
  const handlePointerDown = (e) => {
    if (e.button !== 0) return; // Only primary mouse button
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const rawRatio = ((e.clientX - rect.left) / rect.width) * 100;
      const clampedRatio = Math.min(Math.max(rawRatio, MIN_SPLIT_RATIO), MAX_SPLIT_RATIO);
      splitRatioRef.current = clampedRatio;
      setSplitRatio(clampedRatio);
    };

    const onPointerUp = () => {
      setIsDragging(false);
      localStorage.setItem("oncode_workspace_split", splitRatioRef.current.toString());
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [isDragging]);

  const handleResetRatio = () => {
    splitRatioRef.current = DEFAULT_SPLIT_RATIO;
    setSplitRatio(DEFAULT_SPLIT_RATIO);
    localStorage.setItem("oncode_workspace_split", DEFAULT_SPLIT_RATIO.toString());
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSplitRatio((prev) => {
        const next = Math.max(prev - 2, MIN_SPLIT_RATIO);
        splitRatioRef.current = next;
        localStorage.setItem("oncode_workspace_split", next.toString());
        return next;
      });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setSplitRatio((prev) => {
        const next = Math.min(prev + 2, MAX_SPLIT_RATIO);
        splitRatioRef.current = next;
        localStorage.setItem("oncode_workspace_split", next.toString());
        return next;
      });
    } else if (e.key === "Home") {
      e.preventDefault();
      splitRatioRef.current = MIN_SPLIT_RATIO;
      setSplitRatio(MIN_SPLIT_RATIO);
      localStorage.setItem("oncode_workspace_split", MIN_SPLIT_RATIO.toString());
    } else if (e.key === "End") {
      e.preventDefault();
      splitRatioRef.current = MAX_SPLIT_RATIO;
      setSplitRatio(MAX_SPLIT_RATIO);
      localStorage.setItem("oncode_workspace_split", MAX_SPLIT_RATIO.toString());
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleResetRatio();
    }
  };

  // --- Execution Handlers ---

  const handleRun = async () => {
    const currentCode = editorRef.current ? editorRef.current.getValue() : codeRef.current;
    if (!currentCode || currentCode.trim() === "") return;
    
    setLoadingAction("run");
    setRunResult(null); 
    setSubmitResult(null); 
    setMobileView("editor"); 
    
    try {
      const payload = {
        code: currentCode,
        language: selectedLanguage,
      };

      const { data } = await axiosClient.post(`/submission/run/${problemId}`, payload);
      
      setRunResult(data);
      setActiveRightTab("Result"); 
    } catch (error) {
      console.error("Failed to execute code:", error);
      setRunResult({
        status: "System Error",
        errorMessage: getApiErrorMessage(error, "Failed to connect to the execution server."),
        input: "",
        expectedOutput: "",
        actualOutput: "",
        runtime: 0,
        memory: 0
      });
      setActiveRightTab("Result");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSubmit = async () => {
    const currentCode = editorRef.current ? editorRef.current.getValue() : codeRef.current;
    if (!currentCode || currentCode.trim() === "") return;
    
    setLoadingAction("submit");
    setSubmitResult(null); 
    setRunResult(null); 
    setMobileView("editor"); 
    
    try {
      const payload = {
        code: currentCode,
        language: selectedLanguage,
      };

      const { data } = await axiosClient.post(`/submission/submit/${problemId}`, payload);
      
      
      setSubmitResult(data.submissionResult);
      setActiveRightTab("Result"); 
      
    } catch (error) {
      console.error("Failed to submit code:", error);
      setSubmitResult({
        status: "System Error",
        errorMessage: getApiErrorMessage(error, "Failed to connect to the evaluation server."),
        testCasesPassed: 0,
        testCasesTotal: 0,
        runtime: 0,
        memory: 0
      });
      setActiveRightTab("Result");
    } finally {
      setLoadingAction(null);
    }
  };

  if (loadError) {
    return (
      <div className="flex flex-col h-screen bg-base-300">
        <GlobalNavbar />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center text-base-content">
          {loadError === "not-found" ? (
            <>
              <h1 className="text-2xl font-bold">Problem not found</h1>
              <p className="text-base-content/60">This problem doesn't exist or has been removed.</p>
              <Link to="/" className="btn btn-primary btn-sm mt-2">Back to problems</Link>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Couldn't load this problem</h1>
              <p className="text-base-content/60">Check your connection and try again.</p>
              <div className="flex gap-2 mt-2">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setReloadKey((k) => k + 1)}>Retry</button>
                <Link to="/" className="btn btn-ghost btn-sm">Back to problems</Link>
              </div>
            </>
          )}
        </main>
      </div>
    );
  }

  // Prevent rendering until we have basic problem data
  if (!problem) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-300">
        <span className="loading loading-spinner text-primary loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-base-300">
      <GlobalNavbar></GlobalNavbar>
      {/* Mobile Top Switcher (Visible only below lg) */}
      <div className="lg:hidden flex bg-base-200 border-b border-base-content/10 px-2 py-1.5 gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setMobileView("problem")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            mobileView === "problem"
              ? "bg-primary text-primary-content shadow-sm"
              : "text-base-content/70 hover:bg-base-300"
          }`}
        >
          Problem Statement
        </button>
        <button
          type="button"
          onClick={() => setMobileView("editor")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            mobileView === "editor"
              ? "bg-primary text-primary-content shadow-sm"
              : "text-base-content/70 hover:bg-base-300"
          }`}
        >
          Code & Run
        </button>
      </div>

      <div
        ref={containerRef}
        style={{
          '--split-ratio': `${splitRatio}%`,
          '--left-width': isLeftFullScreen ? '100%' : isRightFullScreen ? '0%' : `${splitRatio}%`,
          '--right-width': isRightFullScreen ? '100%' : isLeftFullScreen ? '0%' : `calc(${100 - splitRatio}% - 6px)`,
        }}
        className={`flex flex-col lg:flex-row flex-1 min-h-0 w-full bg-base-300 text-base-content overflow-hidden ${
          isDragging ? "select-none cursor-col-resize" : ""
        }`}
      >
        
        {/* ================= LEFT PANE (Problem Details) ================= */}
        <div
          className={`flex-col min-w-0 overflow-hidden bg-base-300 ${
            isDragging
              ? "transition-none pointer-events-none"
              : "transition-[width,opacity] duration-300 ease-in-out"
          } ${
            isRightFullScreen
              ? "lg:w-0 lg:opacity-0 lg:pointer-events-none"
              : isLeftFullScreen
              ? "w-full lg:w-full lg:opacity-100"
              : "w-full lg:w-[var(--left-width)] lg:opacity-100"
          } lg:flex-none ${
            isRightFullScreen
              ? "hidden lg:flex"
              : mobileView === "problem"
              ? "flex max-lg:flex-1"
              : "hidden lg:flex"
          }`}
        >
          {/* Left Header Tabs */}
          <div className="flex items-center justify-between bg-base-200 border-b border-base-content/10 px-2 h-12 shrink-0">
            <div className="flex space-x-1 overflow-x-auto no-scrollbar">
              {leftTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveLeftTab(tab)}
                  className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                    activeLeftTab === tab
                      ? "bg-base-300 text-base-content shadow-sm"
                      : "text-base-content/60 hover:text-base-content hover:bg-base-300/50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Fullscreen Toggle (Desktop only) */}
            <button
              onClick={toggleLeftFullScreen}
              className="hidden lg:inline-flex p-2 text-base-content/60 hover:text-base-content hover:bg-base-300 rounded-md ml-2"
              title={isLeftFullScreen ? "Exit Fullscreen" : "Fullscreen"}
              aria-label={isLeftFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isLeftFullScreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Left Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative">
            {activeLeftTab === "Description" && (
              <ProblemDescription problem={problem} />
            )}
            {activeLeftTab === "Solution" && (
              <ProblemSolution problemId={problemId} />
            )}
            {/* Persistent ChatAI Container to preserve conversation state */}
            <div className={`absolute inset-0 ${activeLeftTab === "ChatAI" ? "block" : "hidden"}`}>
              <ChatAI
                key={problem?._id}
                problem={problem}
                getCode={() => (editorRef.current ? editorRef.current.getValue() : codeRef.current)}
                code={code}
                language={selectedLanguage}
                isVisible={activeLeftTab === "ChatAI"}
              />
            </div>
            {activeLeftTab === "Submissions" && (
              <ProblemSubmissions problemId={problemId} />
            )}
          </div>
        </div>

        {/* ================= RESIZABLE DIVIDER (Desktop only) ================= */}
        <div
          role="separator"
          tabIndex={isLeftFullScreen || isRightFullScreen ? -1 : 0}
          aria-orientation="vertical"
          aria-label="Resize workspace panels"
          aria-valuenow={Math.round(splitRatio)}
          aria-valuemin={MIN_SPLIT_RATIO}
          aria-valuemax={MAX_SPLIT_RATIO}
          onPointerDown={handlePointerDown}
          onDoubleClick={handleResetRatio}
          onKeyDown={handleKeyDown}
          title="Drag to resize, double-click to reset"
          className={`hidden lg:flex relative items-center justify-center shrink-0 cursor-col-resize select-none group z-20 touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            isDragging
              ? "bg-primary w-2 transition-none"
              : "transition-[width,opacity] duration-300 ease-in-out"
          } ${
            isLeftFullScreen || isRightFullScreen
              ? "w-0 opacity-0 pointer-events-none overflow-hidden"
              : "w-1.5 hover:w-2 opacity-100 bg-base-content/10 hover:bg-primary/50 before:absolute before:inset-y-0 before:-left-1.5 before:-right-1.5 before:content-['']"
          }`}
        >
          <div className="w-0.5 h-8 rounded-full bg-base-content/30 group-hover:bg-primary-content/80 transition-colors pointer-events-none" />
        </div>

        {/* ================= RIGHT PANE (Code Editor & Execution) ================= */}
        <div
          className={`flex-col min-w-0 overflow-hidden bg-base-300 ${
            isDragging
              ? "transition-none pointer-events-none"
              : "transition-[width,opacity] duration-300 ease-in-out"
          } ${
            isLeftFullScreen
              ? "lg:w-0 lg:opacity-0 lg:pointer-events-none"
              : isRightFullScreen
              ? "w-full lg:w-full lg:opacity-100"
              : "w-full lg:w-[var(--right-width)] lg:opacity-100"
          } lg:flex-none ${
            isLeftFullScreen
              ? "hidden lg:flex"
              : mobileView === "editor"
              ? "flex max-lg:flex-1"
              : "hidden lg:flex"
          }`}
        >
          {/* Right Header Tabs */}
          <div className="flex items-center justify-between bg-base-200 border-b border-base-content/10 px-2 h-12 shrink-0">
            <div className="flex space-x-1">
              {rightTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveRightTab(tab)}
                  className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                    activeRightTab === tab
                      ? "bg-base-300 text-base-content shadow-sm"
                      : "text-base-content/60 hover:text-base-content hover:bg-base-300/50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Fullscreen Toggle (Desktop only) */}
            <button
              onClick={toggleRightFullScreen}
              className="hidden lg:inline-flex p-2 text-base-content/60 hover:text-base-content hover:bg-base-300 rounded-md"
              title={isRightFullScreen ? "Exit Fullscreen" : "Fullscreen"}
              aria-label={isRightFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isRightFullScreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Right Content Area (Dynamic Tabs) */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            {/* Persistent ProblemCodeEditor Container to preserve editor state, undo history, and cursor */}
            <div className={`flex-1 flex flex-col min-h-0 min-w-0 ${activeRightTab === "Code" ? "flex" : "hidden"}`}>
              <ProblemCodeEditor
                key={problemId}
                path={`${problemId}-${selectedLanguage}`}
                defaultValue={starterCodes[selectedLanguage] ?? PLACEHOLDER_CODE}
                onCodeChange={handleCodeChange}
                selectedLanguage={selectedLanguage}
                setSelectedLanguage={handleLanguageChange}
                fontSize={fontSize}
                setFontSize={setFontSize}
                languages={languages}
                fontSizes={fontSizes}
                handleEditorDidMount={handleEditorDidMount}
              />
            </div>

            {activeRightTab === "Testcase" && (
              <ProblemTestcase problem={problem} />
            )}

            {activeRightTab === "Result" && (
              <ProblemResult 
                runResult={runResult} 
                submitResult={submitResult} 
                loading={loadingAction !== null} 
              />
            )}
          </div>

          {/* Bottom Execution Toolbar (Always Visible in Editor View) */}
          <div className="flex items-center justify-end px-3 sm:px-4 h-14 bg-base-200 border-t border-base-content/10 gap-3 shrink-0">
            <button
              onClick={handleRun}
              disabled={loadingAction !== null}
              aria-label="Run Code"
              className="btn btn-sm btn-neutral font-medium px-4 sm:px-6"
            >
              {loadingAction === "run" ? (
                <span className="loading loading-spinner loading-xs mr-1"></span>
              ) : (
                <Play className="w-4 h-4 mr-1" />
              )}
              Run
            </button>
            <button
              onClick={handleSubmit}
              disabled={loadingAction !== null}
              aria-label="Submit Solution"
              className="btn btn-sm btn-success text-success-content font-medium px-4 sm:px-6"
            >
              {loadingAction === "submit" ? (
                <span className="loading loading-spinner loading-xs mr-1"></span>
              ) : (
                <Send className="w-4 h-4 mr-1" />
              )}
              Submit
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProblemWorkSpace;