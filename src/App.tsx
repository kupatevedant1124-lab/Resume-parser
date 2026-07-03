import React, { useState, useEffect } from "react";
import { LayoutDashboard, UploadCloud, Users, History, Code2, Cpu, BrainCircuit } from "lucide-react";
import { motion } from "motion/react";
import DashboardView from "./components/DashboardView";
import UploadView from "./components/UploadView";
import DatabaseView from "./components/DatabaseView";
import HistoryView from "./components/HistoryView";
import PythonCodebaseTab from "./components/PythonCodebaseTab";
import { Candidate, UploadLog, DashboardStats } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [logs, setLogs] = useState<UploadLog[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCandidates: 0,
    avgSkills: 0,
    topSkills: [],
    experienceDistribution: [],
    recentLogs: [],
  });

  const [loading, setLoading] = useState(true);

  const fetchAppData = async () => {
    try {
      // Fetch Candidates
      const cRes = await fetch("/api/candidates");
      const cData = await cRes.json();
      setCandidates(cData);

      // Fetch Dashboard Stats
      const sRes = await fetch("/api/dashboard/stats");
      const sData = await sRes.json();
      setStats(sData);

      // Fetch Log History
      const hRes = await fetch("/api/history");
      const hData = await hRes.json();
      setLogs(hData);

      setLoading(false);
    } catch (err) {
      console.error("Failed to sync full-stack state variables on frontend:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppData();
  }, []);

  const handleParseComplete = (candidate: Candidate) => {
    // Re-fetch all metrics to sync Dashboard and directory lists
    fetchAppData();
    // Switch to directory to show newly added profile!
    setActiveTab("directory");
  };

  const handleDeleteCandidate = async (id: string) => {
    try {
      const res = await fetch(`/api/candidates/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAppData();
      } else {
        alert("Could not complete profile delete operation.");
      }
    } catch (err) {
      console.error("Failed to delete candidate:", err);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 antialiased overflow-hidden">
      {/* Side Navigation Rail */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 h-full border-r border-slate-800">
        <div>
          {/* Brand log */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white flex items-center justify-center">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-slate-100 tracking-wider block">ResumeParser</span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest block mt-0.5">Evaluation Center</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 mt-4">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-150 ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                  : "hover:bg-slate-800 hover:text-slate-100 text-slate-400"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard Overview
            </button>

            <button
              onClick={() => setActiveTab("parser")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-150 ${
                activeTab === "parser"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                  : "hover:bg-slate-800 hover:text-slate-100 text-slate-400"
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              Resume Parser
            </button>

            <button
              onClick={() => setActiveTab("directory")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-150 ${
                activeTab === "directory"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                  : "hover:bg-slate-800 hover:text-slate-100 text-slate-400"
              }`}
            >
              <Users className="w-4 h-4" />
              Candidates Directory
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-150 ${
                activeTab === "history"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                  : "hover:bg-slate-800 hover:text-slate-100 text-slate-400"
              }`}
            >
              <History className="w-4 h-4" />
              Upload History
            </button>

            <button
              onClick={() => setActiveTab("python_project")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-150 ${
                activeTab === "python_project"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                  : "hover:bg-slate-800 hover:text-slate-100 text-slate-400"
              }`}
            >
              <Code2 className="w-4 h-4" />
              Python Codebase
            </button>
          </nav>
        </div>

        {/* Footer info block */}
        <div className="p-6 border-t border-slate-800 text-center space-y-1">
          <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Evaluation Workspace</span>
          <span className="block text-[11px] text-blue-500 font-semibold">Python 3.12 + Flask</span>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-grow flex flex-col h-full overflow-hidden">
        {/* Header Bar */}
        <header className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-slate-800 capitalize tracking-tight">
              {activeTab.replace("_", " ")} Workspace
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="block text-xs font-extrabold text-slate-700">Senior NLP Developer</span>
              <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Internship Evaluator</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 border text-xs">
              SE
            </div>
          </div>
        </header>

        {/* Dynamic View Frame */}
        <div className="flex-grow overflow-y-auto p-8 bg-slate-50">
          {loading ? (
            <div className="h-full w-full flex flex-col items-center justify-center gap-3 text-slate-500 text-sm font-semibold">
              <Cpu className="w-8 h-8 text-blue-500 animate-spin" />
              Synchronizing Application Databases...
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === "dashboard" && <DashboardView stats={stats} onNavigate={setActiveTab} />}
              {activeTab === "parser" && <UploadView onParseComplete={handleParseComplete} />}
              {activeTab === "directory" && (
                <DatabaseView candidates={candidates} onDeleteCandidate={handleDeleteCandidate} />
              )}
              {activeTab === "history" && <HistoryView logs={logs} />}
              {activeTab === "python_project" && <PythonCodebaseTab />}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
