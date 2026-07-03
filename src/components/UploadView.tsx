import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, RefreshCw, AlertTriangle, ArrowRight, Copy, Download, Code, ClipboardCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Candidate } from "../types";

interface UploadViewProps {
  onParseComplete: (candidate: Candidate) => void;
}

export default function UploadView({ onParseComplete }: UploadViewProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isOverwrite, setIsOverwrite] = useState(false);
  
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseLog, setParseLog] = useState("");
  
  const [parsedCandidate, setParsedCandidate] = useState<Candidate | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{ show: boolean; message: string; candidate: Candidate } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx") {
      alert("Unsupported file format! Please upload PDF or DOCX files.");
      return;
    }
    setFile(selectedFile);
    setParsedCandidate(null);
    setDuplicateWarning(null);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const resetSelection = () => {
    setFile(null);
    setParseProgress(0);
    setParseLog("");
    setParsedCandidate(null);
    setDuplicateWarning(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startParsing = async (forceOverwrite = false) => {
    if (!file) return;

    setIsParsing(true);
    setDuplicateWarning(null);
    setParseProgress(10);
    setParseLog("Reading file data stream...");

    // Convert file to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64String = (reader.result as string).split(",")[1];

        // Progressive step-by-step update logs
        const logs = [
          { p: 25, l: "Preprocessing document layouts and text..." },
          { p: 50, l: "Running regular expression entity filters..." },
          { p: 75, l: "Querying Gemini Named Entity Recognition (NER) model..." },
          { p: 90, l: "Cross-matching discovered entities against skills database..." },
        ];

        let logIndex = 0;
        const progressInterval = setInterval(() => {
          if (logIndex < logs.length) {
            setParseProgress(logs[logIndex].p);
            setParseLog(logs[logIndex].l);
            logIndex++;
          } else {
            clearInterval(progressInterval);
          }
        }, 800);

        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            mimeType: file.type,
            size: file.size,
            base64: base64String,
            overwrite: forceOverwrite || isOverwrite,
          }),
        });

        clearInterval(progressInterval);
        const data = await response.json();

        if (response.ok) {
          if (data.duplicate) {
            setParseProgress(0);
            setIsParsing(false);
            setDuplicateWarning({
              show: true,
              message: data.message,
              candidate: data.candidate,
            });
            return;
          }

          setParseProgress(100);
          setParseLog("NLP Extraction complete! Saved to database successfully.");
          setTimeout(() => {
            setParsedCandidate(data.candidate);
            onParseComplete(data.candidate);
            setIsParsing(false);
          }, 600);
        } else {
          alert(data.error || "Parsing failed. Please check file validity.");
          setIsParsing(false);
          setParseProgress(0);
        }
      } catch (err: any) {
        alert("Extraction failed. Could not parse resume payload.");
        setIsParsing(false);
        setParseProgress(0);
      }
    };
  };

  const copyToClipboard = () => {
    if (!parsedCandidate) return;
    navigator.clipboard.writeText(JSON.stringify(parsedCandidate, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Upper Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-500" />
          Extract & Parse Resume
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          Upload any engineering resume in standard PDF or DOCX layout. The AI pipeline will process details,
          identify structural parts, and run duplicate checks automatically.
        </p>

        {!file ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? "border-blue-500 bg-blue-50/50 scale-[0.99]"
                : "border-slate-200 hover:border-slate-400 hover:bg-slate-50/30"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.docx"
            />
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <p className="text-slate-700 font-semibold mb-1">
              Drag & drop resume file here, or <span className="text-blue-600">Browse</span>
            </p>
            <p className="text-xs text-slate-400">PDF and DOCX formats supported up to 16MB</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-grow min-w-0">
                <span className="block font-semibold text-slate-800 truncate">{file.name}</span>
                <span className="block text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
              <button
                onClick={resetSelection}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 border bg-white px-3 py-1.5 rounded-lg transition"
              >
                Change File
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                id="overwrite-check"
                checked={isOverwrite}
                onChange={(e) => setIsOverwrite(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="overwrite-check" className="cursor-pointer font-medium select-none">
                Overwrite candidate entry if email already exists
              </label>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => startParsing(false)}
                disabled={isParsing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-6 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2 text-sm"
              >
                {isParsing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Extract & Parse Profile
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Log Progress Indicator */}
        {isParsing && (
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
            <div className="flex justify-between items-center text-sm font-semibold text-slate-700">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                {parseLog}
              </span>
              <span>{parseProgress}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-600 rounded-full"
                animate={{ width: `${parseProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Duplicate Warning Dialog Box */}
        {duplicateWarning && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col md:flex-row gap-4 items-start"
          >
            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-grow space-y-2">
              <h4 className="font-bold text-amber-800 text-sm">Duplicate Candidate Indexed</h4>
              <p className="text-xs text-amber-700">
                {duplicateWarning.message} Overwriting will completely replace the previous profile mapping.
              </p>
              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => startParsing(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition"
                >
                  Force Overwrite Profile
                </button>
                <button
                  onClick={resetSelection}
                  className="bg-white border border-amber-300 text-amber-700 font-semibold text-xs px-4 py-2 rounded-lg hover:bg-amber-100/50 transition"
                >
                  Cancel Upload
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Side-by-Side Live Parsed Panel */}
      <AnimatePresence>
        {parsedCandidate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Visual Profile Card Preview */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  {parsedCandidate.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-800">{parsedCandidate.name}</h4>
                  <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-semibold border border-blue-100 mt-1 inline-block">
                    Candidate Profile
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm text-slate-600">
                <span className="block"><strong>Email:</strong> {parsedCandidate.email || "N/A"}</span>
                <span className="block"><strong>Phone:</strong> {parsedCandidate.phone || "N/A"}</span>
                <span className="block"><strong>Address:</strong> {parsedCandidate.address || "N/A"}</span>
                {parsedCandidate.linkedin && (
                  <span className="block">
                    <strong>LinkedIn:</strong> <a href={parsedCandidate.linkedin} target="_blank" className="text-blue-600 hover:underline">{parsedCandidate.linkedin}</a>
                  </span>
                )}
                {parsedCandidate.github && (
                  <span className="block">
                    <strong>GitHub:</strong> <a href={parsedCandidate.github} target="_blank" className="text-slate-800 hover:underline">{parsedCandidate.github}</a>
                  </span>
                )}
              </div>

              {parsedCandidate.summary && (
                <div>
                  <h5 className="font-bold text-slate-700 text-sm mb-2">Professional Summary</h5>
                  <p className="text-xs text-slate-500 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                    {parsedCandidate.summary}
                  </p>
                </div>
              )}

              <div>
                <h5 className="font-bold text-slate-700 text-sm mb-2">Technical Skills</h5>
                <div className="flex flex-wrap gap-1.5">
                  {parsedCandidate.skills.map((s) => (
                    <span key={s} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-semibold border border-blue-100/30">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-bold text-slate-700 text-sm mb-2">Education History</h5>
                <ul className="space-y-1">
                  {parsedCandidate.education.map((edu, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                      {edu}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h5 className="font-bold text-slate-700 text-sm mb-2">Work Experience</h5>
                <ul className="space-y-1">
                  {parsedCandidate.experience.map((exp, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                      {exp}
                    </li>
                  ))}
                </ul>
              </div>

              {parsedCandidate.certifications.length > 0 && (
                <div>
                  <h5 className="font-bold text-slate-700 text-sm mb-2">Certifications & Badges</h5>
                  <ul className="space-y-1">
                    {parsedCandidate.certifications.map((cert, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                        {cert}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Structured JSON Syntax Highlight View */}
            <div className="bg-slate-900 rounded-2xl p-6 shadow-xl flex flex-col h-full border border-slate-800 text-slate-300">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-200">
                  <Code className="w-4 h-4 text-emerald-400" />
                  Extracted JSON Schema Output
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 text-xs font-semibold"
                  >
                    {isCopied ? (
                      <>
                        <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        Copy JSON
                      </>
                    )}
                  </button>
                  <a
                    href={`/api/candidates/${parsedCandidate.id}/download`}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    Download JSON
                  </a>
                </div>
              </div>

              <div className="flex-grow overflow-auto max-h-[580px] font-mono text-xs leading-relaxed text-emerald-400 select-text p-2 bg-slate-950 rounded-xl">
                <pre>{JSON.stringify(parsedCandidate, null, 2)}</pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
