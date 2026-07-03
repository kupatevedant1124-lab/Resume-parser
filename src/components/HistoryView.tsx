import React from "react";
import { Clock, CheckCircle2, XCircle, Trash2, ArrowRight } from "lucide-react";
import { UploadLog } from "../types";

interface HistoryViewProps {
  logs: UploadLog[];
}

export default function HistoryView({ logs }: HistoryViewProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Extraction Log Log
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Tracks historical parsing operations, duplicates merges, deletions, and pipeline successes.
          </p>
        </div>
        <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full">
          {logs.length} Actions Recorded
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Filename</th>
              <th className="py-3 px-4">Discovered Candidate</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/40 transition">
                  <td className="py-4 px-4 font-semibold">
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-md font-bold ${
                        log.action === "DELETE"
                          ? "bg-rose-50 text-rose-600 border border-rose-100/30"
                          : "bg-blue-50 text-blue-600 border border-blue-100/30"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-700 truncate max-w-xs">{log.filename}</td>
                  <td className="py-4 px-4 font-medium text-slate-800">{log.candidateName}</td>
                  <td className="py-4 px-4 text-xs text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5">
                      {log.status === "SUCCESS" ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-semibold text-emerald-600">SUCCESS</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-500" />
                          <span className="text-xs font-semibold text-rose-600">FAILED</span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                  No activities logged yet. Parses and deletions will record details automatically.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
