import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Users, Code, Award, Activity, Trash2, CheckCircle, FileText } from "lucide-react";
import { motion } from "motion/react";
import { DashboardStats, UploadLog } from "../types";

interface DashboardViewProps {
  stats: DashboardStats;
  onNavigate: (tab: string) => void;
}

export default function DashboardView({ stats, onNavigate }: DashboardViewProps) {
  const COLORS = ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#6366f1"];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-200"
        >
          <div className="p-4 rounded-xl bg-blue-50 text-blue-600">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider block">Indexed Candidates</span>
            <span className="text-3xl font-bold text-slate-800">{stats.totalCandidates}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-200"
        >
          <div className="p-4 rounded-xl bg-cyan-50 text-cyan-600">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider block">Avg. Skills / Resume</span>
            <span className="text-3xl font-bold text-slate-800">{stats.avgSkills}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-200"
        >
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-600">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider block">Extraction Success Rate</span>
            <span className="text-3xl font-bold text-slate-800">
              {stats.recentLogs.length > 0
                ? `${Math.round(
                    (stats.recentLogs.filter((l) => l.status === "SUCCESS").length / stats.recentLogs.length) * 100
                  )}%`
                : "100%"}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Skills Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-500" />
            Skills Frequency Distribution
          </h3>
          <div className="h-72 w-full">
            {stats.topSkills.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topSkills} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", border: "none", color: "#fff" }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={28}>
                    {stats.topSkills.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-content-center text-slate-400 text-sm">
                <FileText className="w-12 h-12 mb-2 stroke-1" />
                Upload resumes to generate skills analytics
              </div>
            )}
          </div>
        </div>

        {/* Experience Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-500" />
            Experience Level Ratios
          </h3>
          <div className="h-72 w-full flex flex-col md:flex-row items-center justify-center gap-6">
            {stats.totalCandidates > 0 ? (
              <>
                <div className="h-48 w-48 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.experienceDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {stats.experienceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", border: "none", color: "#fff" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-slate-700">{stats.totalCandidates}</span>
                    <span className="text-xs text-slate-400 uppercase tracking-wide">Total</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {stats.experienceDistribution.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-sm font-medium text-slate-600">{entry.name}</span>
                      <span className="text-sm font-bold text-slate-800">({entry.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                <Users className="w-12 h-12 mb-2 stroke-1" />
                Upload resumes to view experience distributions
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Extraction Activities */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Recent Log Logs
          </h3>
          <button
            onClick={() => onNavigate("history")}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            See full history
          </button>
        </div>

        <div className="divide-y divide-slate-100 overflow-hidden">
          {stats.recentLogs.length > 0 ? (
            stats.recentLogs.map((log) => (
              <div key={log.id} className="py-4 flex items-center justify-between hover:bg-slate-50/50 transition duration-150 px-2 rounded-lg">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div
                    className={`p-2 rounded-lg ${
                      log.action === "DELETE"
                        ? "bg-rose-50 text-rose-500"
                        : log.status === "FAILED"
                        ? "bg-amber-50 text-amber-500"
                        : "bg-emerald-50 text-emerald-500"
                    }`}
                  >
                    {log.action === "DELETE" ? (
                      <Trash2 className="w-5 h-5" />
                    ) : log.status === "FAILED" ? (
                      <Activity className="w-5 h-5" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <span className="block font-semibold text-sm text-slate-800 text-truncate">
                      {log.action === "DELETE" ? `Deleted Profile: ${log.candidateName}` : log.details}
                    </span>
                    <span className="block text-xs text-slate-400 mt-0.5">
                      File: {log.filename} • {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                    log.status === "SUCCESS"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      : "bg-rose-50 text-rose-600 border border-rose-100"
                  }`}
                >
                  {log.status}
                </span>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm">
              No processing actions logged yet. Go to the **Resume Parser** tab to upload and parse.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
