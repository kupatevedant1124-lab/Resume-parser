import React, { useState, useEffect } from "react";
import { Search, Mail, Phone, MapPin, Briefcase, Eye, Trash2, Download, ArrowRight, Star, ExternalLink, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Candidate } from "../types";

interface DatabaseViewProps {
  candidates: Candidate[];
  onDeleteCandidate: (id: string) => void;
}

export default function DatabaseView({ candidates, onDeleteCandidate }: DatabaseViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    let result = [...candidates];

    // Simple search filtering
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q) ||
          c.skills.some((s) => s.toLowerCase().includes(q)) ||
          c.education.some((e) => e.toLowerCase().includes(q)) ||
          c.experience.some((exp) => exp.toLowerCase().includes(q))
      );
    }

    // Dynamic Skill Match Scoring
    if (requiredSkills.trim() !== "") {
      const skillsQuery = requiredSkills
        .toLowerCase()
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "");

      if (skillsQuery.length > 0) {
        // Map candidates to add match score
        const scored = result.map((c) => {
          const candidateSkillsLower = c.skills.map((s) => s.toLowerCase());
          const matched = skillsQuery.filter((sq) =>
            candidateSkillsLower.some((cs) => cs.includes(sq) || sq.includes(cs))
          );
          const score = Math.round((matched.length / skillsQuery.length) * 100);
          return { ...c, matchScore: score };
        });

        // Filter and Sort by score descending
        result = scored
          .filter((c) => (c.matchScore ?? 0) > 0)
          .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0)) as Candidate[];
      }
    }

    setFilteredCandidates(result);
  }, [candidates, searchQuery, requiredSkills]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Search & Index Listing Control */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800">Filter Directories</h3>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, school, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition bg-slate-50/50"
            />
          </div>

          {/* Skills match matcher */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
              Dynamic Skill Target (Comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Python, Flask, React, AWS"
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition bg-slate-50/50"
            />
            <span className="text-[11px] text-slate-400 block leading-tight">
              Calculates direct skill alignment scores and ranks candidates instantly.
            </span>
          </div>
        </div>

        {/* Directory List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 min-h-[480px]">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h4 className="font-bold text-slate-800 text-sm">Indexed Profiles</h4>
            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full">
              {filteredCandidates.length} Found
            </span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((c) => {
                const isActive = activeCandidate?.id === c.id;
                // @ts-ignore (matchScore could be on scored candidates)
                const score = c.matchScore;

                return (
                  <motion.div
                    key={c.id}
                    onClick={() => setActiveCandidate(c)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isActive
                        ? "border-blue-500 bg-blue-50/30 shadow-sm"
                        : "border-slate-100 hover:border-slate-300 hover:bg-slate-50/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                          {c.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-800 text-sm">{c.name}</h5>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {c.email || "No Email"} • {new Date(c.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {score !== undefined && (
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg border border-amber-100 text-xs font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500" />
                          {score}%
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 mt-3">
                      {c.skills.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold"
                        >
                          {s}
                        </span>
                      ))}
                      {c.skills.length > 3 && (
                        <span className="text-slate-400 text-[10px] font-medium pt-0.5">
                          +{c.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-16 text-slate-400 text-sm">
                No profiles match your search criteria.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Profile Detailed Drawer */}
      <div className="lg:col-span-7">
        <AnimatePresence mode="wait">
          {activeCandidate ? (
            <motion.div
              key={activeCandidate.id}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6 min-h-[580px]"
            >
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    {activeCandidate.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{activeCandidate.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-semibold border border-blue-100">
                        Candidate Profile
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        Added {new Date(activeCandidate.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`/api/candidates/${activeCandidate.id}/download`}
                    className="p-2 rounded-xl bg-slate-50 border hover:bg-slate-100 text-slate-600 transition flex items-center gap-2 text-xs font-semibold"
                  >
                    <Download className="w-4 h-4" />
                    Download JSON
                  </a>
                  <button
                    onClick={() => onDeleteCandidate(activeCandidate.id)}
                    className="p-2 rounded-xl bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 transition flex items-center gap-2 text-xs font-semibold"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>

              {/* Contact grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-sm border border-slate-100">
                <div className="flex items-center gap-2.5 text-slate-600 overflow-hidden">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href={`mailto:${activeCandidate.email}`} className="hover:underline text-slate-700 truncate">{activeCandidate.email || "N/A"}</a>
                </div>
                <div className="flex items-center gap-2.5 text-slate-600 overflow-hidden">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href={`tel:${activeCandidate.phone}`} className="hover:underline text-slate-700 truncate">{activeCandidate.phone || "N/A"}</a>
                </div>
                <div className="flex items-center gap-2.5 text-slate-600 overflow-hidden col-span-1 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{activeCandidate.address || "N/A"}</span>
                </div>
              </div>

              {/* Handles links */}
              {(activeCandidate.linkedin || activeCandidate.github) && (
                <div className="flex flex-wrap gap-4 pt-1">
                  {activeCandidate.linkedin && (
                    <a
                      href={activeCandidate.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      LinkedIn Profile
                    </a>
                  )}
                  {activeCandidate.github && (
                    <a
                      href={activeCandidate.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-slate-800 hover:underline flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-lg border"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      GitHub Profile
                    </a>
                  )}
                </div>
              )}

              {/* Professional pitch Summary */}
              {activeCandidate.summary && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 text-sm">Professional Summary</h4>
                  <p className="text-xs text-slate-500 leading-relaxed bg-slate-50/30 p-4 rounded-xl border border-slate-100">
                    {activeCandidate.summary}
                  </p>
                </div>
              )}

              {/* Skills */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-sm">Extracted Technical Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeCandidate.skills.map((s) => (
                    <span
                      key={s}
                      className="bg-blue-50 text-blue-600 border border-blue-100/40 px-3 py-1 rounded text-xs font-semibold"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-sm">Education History</h4>
                <ul className="space-y-2 pl-1">
                  {activeCandidate.education.map((edu, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-3 leading-relaxed">
                      <ArrowRight className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      {edu}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Experience */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-sm">Professional Work Experience</h4>
                <ul className="space-y-2 pl-1">
                  {activeCandidate.experience.map((exp, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-3 leading-relaxed">
                      <Briefcase className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      {exp}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Certifications */}
              {activeCandidate.certifications && activeCandidate.certifications.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 text-sm">Certifications & Credentials</h4>
                  <ul className="space-y-2 pl-1">
                    {activeCandidate.certifications.map((cert, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start gap-3 leading-relaxed">
                        <ArrowRight className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                        {cert}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Resume Source Filename details */}
              <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
                <span>Source File: {activeCandidate.resume_file.name}</span>
                <span>{(activeCandidate.resume_file.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </motion.div>
          ) : (
            <div className="bg-slate-50/50 rounded-2xl border border-dashed p-12 text-center text-slate-400 min-h-[580px] flex flex-col justify-center items-center">
              <Eye className="w-12 h-12 mb-3 text-slate-300 stroke-1" />
              <p className="font-semibold text-slate-500">No Candidate Selected</p>
              <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                Click on any candidate record in the left index list to review their fully parsed CV details and credentials.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
