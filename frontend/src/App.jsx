import React, { useState, useRef, useEffect } from "react";
// Removed external Monaco import to prevent build errors
// import Editor, { DiffEditor } from "@monaco-editor/react";
import axios from "axios";
import { 
  Play, 
  Bug, 
  CheckCircle2, 
  XCircle, 
  TerminalSquare, 
  Cpu, 
  Code2, 
  RotateCcw,
  ArrowRightLeft
} from "lucide-react";
import clsx from "clsx";

const API_URL = "http://localhost:8000";

const DEFAULT_CODE = `# Intentional Bug: Binary Search
def binary_search(arr, target):
    low = 0
    high = len(arr)  # Bug: Should be len(arr) - 1
    
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
            
    return -1

# Test Case
numbers = [1, 3, 5, 7, 9, 11]
print(f"Index of 9 is: {binary_search(numbers, 9)}")
print(f"Index of 2 is: {binary_search(numbers, 2)}")
`;

// --- Custom Lightweight Editor Components ---

const SimpleEditor = ({ value, onChange, readOnly = false }) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
      readOnly={readOnly}
      spellCheck={false}
      className="w-full h-full bg-[#1e1e1e] text-gray-300 font-mono text-sm p-4 resize-none outline-none border-none leading-relaxed"
      style={{ fontFamily: '"Fira Code", "Consolas", monospace' }}
    />
  );
};

const SimpleDiffView = ({ original, modified }) => {
  return (
    <div className="flex h-full w-full">
      <div className="flex-1 flex flex-col border-r border-[#333]">
        <div className="bg-red-900/20 text-red-200 text-xs px-2 py-1 font-mono border-b border-red-900/30 text-center">
          Original (Buggy)
        </div>
        <textarea
          value={original}
          readOnly
          className="flex-1 bg-[#1e1e1e] text-red-100/70 font-mono text-sm p-4 resize-none outline-none border-none leading-relaxed opacity-80"
          spellCheck={false}
        />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="bg-green-900/20 text-green-200 text-xs px-2 py-1 font-mono border-b border-green-900/30 text-center">
          AI Fix (Proposed)
        </div>
        <textarea
          value={modified}
          readOnly
          className="flex-1 bg-[#1e1e1e] text-green-100/90 font-mono text-sm p-4 resize-none outline-none border-none leading-relaxed"
          spellCheck={false}
        />
      </div>
    </div>
  );
};

// --- Main Application ---

export default function App() {
  // State
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState("Ready to execute...");
  const [analysis, setAnalysis] = useState("");
  const [fixedCode, setFixedCode] = useState("");
  
  // UI State
  const [mode, setMode] = useState("edit"); // 'edit' | 'diff'
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [activeTab, setActiveTab] = useState("terminal"); // 'terminal' | 'analysis'

  // --- Actions ---

  const handleRun = async () => {
    setLoading(true);
    setLoadingMsg("Compiling & Running in Sandbox...");
    setActiveTab("terminal");
    
    try {
      const res = await axios.post(`${API_URL}/run`, { 
        code, 
        language: "python" 
      });
      setOutput(res.data.logs || "No output returned.");
    } catch (err) {
      setOutput(`System Error: ${err.message}\nCheck if backend is running.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDebug = async () => {
    setLoading(true);
    setLoadingMsg("AI is analyzing stack traces & generating patches...");
    
    try {
      const res = await axios.post(`${API_URL}/debug`, {
        code,
        language: "python",
        logs: output,
        model: "qwen2.5-coder"
      });

      setFixedCode(res.data.fixed_code);
      setAnalysis(res.data.analysis);
      setMode("diff"); // Switch to split view
      setActiveTab("analysis"); // Show the explanation
    } catch (err) {
      setOutput(`AI Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const applyFix = () => {
    setCode(fixedCode);
    setMode("edit");
    setOutput("Fix applied. Run the code to verify.");
    setActiveTab("terminal");
  };

  const rejectFix = () => {
    setMode("edit");
    setOutput("Fix rejected. Restored original code.");
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-gray-300 font-sans overflow-hidden">
      
      {/* --- Header / Toolbar --- */}
      <header className="h-14 border-b border-[#333] bg-[#252526] flex items-center px-4 justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-gray-100 tracking-wide">
            DevForge <span className="text-blue-400 font-normal">AutoDebugger</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {mode === "edit" ? (
            <>
              <button 
                onClick={handleRun}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-1.5 bg-[#2d2d2d] hover:bg-green-700 hover:text-white text-green-400 border border-green-900/30 rounded transition-all text-sm font-medium disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" /> Run Code
              </button>
              <button 
                onClick={handleDebug}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded shadow-lg shadow-blue-900/20 transition-all text-sm font-medium disabled:opacity-50"
              >
                {loading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Bug className="w-4 h-4" />}
                Auto Debug
              </button>
            </>
          ) : (
            <>
               <span className="text-xs text-gray-400 mr-2 flex items-center gap-1">
                 <ArrowRightLeft className="w-3 h-3" /> Diff View Active
               </span>
              <button 
                onClick={applyFix}
                className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded shadow-lg text-sm font-medium"
              >
                <CheckCircle2 className="w-4 h-4" /> Apply Fix
              </button>
              <button 
                onClick={rejectFix}
                className="flex items-center gap-2 px-4 py-1.5 bg-[#2d2d2d] hover:bg-red-900/50 text-red-400 border border-red-900/30 rounded transition-all text-sm font-medium"
              >
                <XCircle className="w-4 h-4" /> Cancel
              </button>
            </>
          )}
        </div>
      </header>

      {/* --- Main Workspace --- */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-[#1e1e1e]/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-4 p-8 bg-[#252526] rounded-xl border border-[#333] shadow-2xl">
              <RotateCcw className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-lg font-medium text-gray-200 animate-pulse">{loadingMsg}</p>
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 relative overflow-hidden">
          {mode === "edit" ? (
            <SimpleEditor 
              value={code} 
              onChange={setCode} 
            />
          ) : (
            <SimpleDiffView 
              original={code} 
              modified={fixedCode} 
            />
          )}
        </div>

        {/* --- Bottom Panel (Terminal / Analysis) --- */}
        <div className="h-64 bg-[#1e1e1e] border-t border-[#333] flex flex-col">
          {/* Panel Tabs */}
          <div className="flex border-b border-[#333] bg-[#252526]">
            <button 
              onClick={() => setActiveTab("terminal")}
              className={clsx(
                "px-4 py-2 text-xs font-medium uppercase tracking-wider flex items-center gap-2 border-r border-[#333] transition-colors",
                activeTab === "terminal" ? "bg-[#1e1e1e] text-white border-t-2 border-t-blue-500" : "text-gray-500 hover:bg-[#2d2d2d]"
              )}
            >
              <TerminalSquare className="w-4 h-4" /> Terminal Output
            </button>
            <button 
              onClick={() => setActiveTab("analysis")}
              className={clsx(
                "px-4 py-2 text-xs font-medium uppercase tracking-wider flex items-center gap-2 border-r border-[#333] transition-colors",
                activeTab === "analysis" ? "bg-[#1e1e1e] text-blue-400 border-t-2 border-t-blue-500" : "text-gray-500 hover:bg-[#2d2d2d]"
              )}
            >
              <Code2 className="w-4 h-4" /> AI Analysis & Fix Logic
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-auto p-0 font-mono text-sm">
            {activeTab === "terminal" && (
              <div className="p-4 text-gray-300 whitespace-pre-wrap">
                {output ? output : <span className="text-gray-600 italic">No output yet. Click 'Run Code' to start.</span>}
              </div>
            )}

            {activeTab === "analysis" && (
              <div className="p-4 bg-[#1e1e1e] h-full overflow-y-auto">
                {analysis ? (
                  <div className="prose prose-invert max-w-none">
                    <h3 className="text-blue-400 font-bold text-sm mb-2 flex items-center gap-2">
                      <Bug className="w-4 h-4" /> Diagnosis
                    </h3>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-line">{analysis}</p>
                    {mode === "diff" && (
                      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800/50 rounded text-blue-200 text-xs">
                        <span className="font-bold">Tip:</span> Review the changes in the split view above. Click "Apply Fix" to accept them.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2 opacity-50">
                    <Bug className="w-8 h-8" />
                    <p>Run the Auto-Debugger to see AI Analysis here.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
      
      {/* Footer Status Bar */}
      <div className="h-6 bg-[#007acc] text-white text-[10px] flex items-center px-3 justify-between select-none">
        <div className="flex items-center gap-4">
          <span>main.py</span>
          <span>Python 3.10</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Ln 1, Col 1</span>
          <span>UTF-8</span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            Online
          </span>
        </div>
      </div>

    </div>
  );
}