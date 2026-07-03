import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
// @ts-ignore
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for file uploads (Base64)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Path for storing JSON database
const DB_FILE = path.join(process.cwd(), "candidates_db.json");
const UPLOAD_LOG_FILE = path.join(process.cwd(), "upload_log.json");

// Define basic skills dictionary for local extraction matching as backup/supplement
const SKILLS_DATABASE = [
  // Languages
  "python", "javascript", "typescript", "c++", "java", "ruby", "golang", "rust", "php", "swift", "kotlin", "sql", "html", "css", "r", "scala", "shell", "bash",
  // Frameworks & Libraries
  "flask", "django", "fastapi", "express", "nodejs", "react", "nextjs", "angular", "vue", "tailwind", "bootstrap", "spacy", "nltk", "scikit-learn", "tensorflow", "pytorch", "pandas", "numpy", "sqlalchemy", "hibernate", "laravel", "spring boot", "jquery", "sass", "graphql",
  // Databases
  "postgresql", "postgres", "sqlite", "mysql", "mongodb", "redis", "cassandra", "dynamodb", "firebase", "firestore", "oracle", "mariadb", "ms sql",
  // Cloud & DevOps
  "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "git", "github", "gitlab", "terraform", "ansible", "heroku", "ci/cd", "linux", "nginx", "apache",
  // Concepts & Domains
  "nlp", "natural language processing", "ner", "machine learning", "deep learning", "artificial intelligence", "data science", "rest api", "soap", "graphql", "microservices", "agile", "scrum", "cloud run", "serverless", "testing", "jest", "pytest", "unit testing", "oop", "mvc",
  // General/Soft Skills
  "communication", "leadership", "teamwork", "problem solving", "project management", "analytical", "critical thinking", "collaboration", "creativity"
];

// Initialize database files if they don't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(UPLOAD_LOG_FILE)) {
  fs.writeFileSync(UPLOAD_LOG_FILE, JSON.stringify([], null, 2));
}

// Read database helper
function readCandidates(): any[] {
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Write database helper
function writeCandidates(candidates: any[]) {
  fs.writeFileSync(DB_FILE, JSON.stringify(candidates, null, 2));
}

// Read log helper
function readLogs(): any[] {
  try {
    const data = fs.readFileSync(UPLOAD_LOG_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Write log helper
function writeLogs(logs: any[]) {
  fs.writeFileSync(UPLOAD_LOG_FILE, JSON.stringify(logs, null, 2));
}

// Initialize Gemini Client
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// API Routes

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiConfigured: !!process.env.GEMINI_API_KEY });
});

// List all candidates with optional search
app.get("/api/candidates", (req, res) => {
  const query = (req.query.q as string || "").toLowerCase();
  const candidates = readCandidates();

  if (!query) {
    return res.json(candidates);
  }

  const filtered = candidates.filter((c) => {
    return (
      c.name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.phone.toLowerCase().includes(query) ||
      c.address.toLowerCase().includes(query) ||
      c.skills.some((s: string) => s.toLowerCase().includes(query)) ||
      c.education.some((e: string) => e.toLowerCase().includes(query)) ||
      c.experience.some((exp: string) => exp.toLowerCase().includes(query))
    );
  });

  res.json(filtered);
});

// Get detailed stats for Dashboard
app.get("/api/dashboard/stats", (req, res) => {
  const candidates = readCandidates();
  const logs = readLogs();

  // Calculate top skills
  const skillCounts: Record<string, number> = {};
  candidates.forEach((c) => {
    c.skills.forEach((skill: string) => {
      const normalized = skill.trim().toLowerCase();
      // Capitalize for clean rendering
      const displaySkill = normalized.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      skillCounts[displaySkill] = (skillCounts[displaySkill] || 0) + 1;
    });
  });

  const topSkills = Object.entries(skillCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Calculate top experience levels
  // Simple heuristic: count of experience list items
  const expLevels = {
    "Junior (0-2 jobs)": 0,
    "Mid-Level (3-4 jobs)": 0,
    "Senior (5+ jobs)": 0,
  };

  candidates.forEach((c) => {
    const count = c.experience ? c.experience.length : 0;
    if (count <= 2) expLevels["Junior (0-2 jobs)"]++;
    else if (count <= 4) expLevels["Mid-Level (3-4 jobs)"]++;
    else expLevels["Senior (5+ jobs)"]++;
  });

  const experienceDistribution = Object.entries(expLevels).map(([name, value]) => ({
    name,
    value,
  }));

  // Average skills count per candidate
  const totalSkills = candidates.reduce((acc, c) => acc + (c.skills?.length || 0), 0);
  const avgSkills = candidates.length > 0 ? Number((totalSkills / candidates.length).toFixed(1)) : 0;

  res.json({
    totalCandidates: candidates.length,
    avgSkills,
    topSkills,
    experienceDistribution,
    recentLogs: logs.slice(-10).reverse(),
  });
});

// Get upload history log
app.get("/api/history", (req, res) => {
  const logs = readLogs();
  res.json(logs.reverse());
});

// Download candidate JSON
app.get("/api/candidates/:id/download", (req, res) => {
  const { id } = req.params;
  const candidates = readCandidates();
  const candidate = candidates.find((c) => c.id === id);

  if (!candidate) {
    return res.status(404).json({ error: "Candidate not found" });
  }

  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=resume_profile_${candidate.name.replace(/\s+/g, "_")}.json`
  );
  res.send(JSON.stringify(candidate, null, 2));
});

// Get single candidate
app.get("/api/candidates/:id", (req, res) => {
  const { id } = req.params;
  const candidates = readCandidates();
  const candidate = candidates.find((c) => c.id === id);

  if (!candidate) {
    return res.status(444).json({ error: "Candidate not found" });
  }

  res.json(candidate);
});

// Delete single candidate
app.delete("/api/candidates/:id", (req, res) => {
  const { id } = req.params;
  let candidates = readCandidates();
  const index = candidates.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Candidate not found" });
  }

  const deletedCandidate = candidates[index];
  candidates.splice(index, 1);
  writeCandidates(candidates);

  // Add delete to history logs
  const logs = readLogs();
  logs.push({
    id: `log_${Date.now()}`,
    action: "DELETE",
    filename: deletedCandidate.resume_file.name,
    candidateName: deletedCandidate.name,
    status: "SUCCESS",
    details: `Deleted candidate profile for ${deletedCandidate.name}`,
    timestamp: new Date().toISOString(),
  });
  writeLogs(logs);

  res.json({ success: true, message: "Candidate deleted successfully" });
});

// Upload and Parse Resume
app.post("/api/upload", async (req, res) => {
  const { name, base64, mimeType, size, overwrite } = req.body;

  if (!name || !base64) {
    return res.status(400).json({ error: "File name and content (base64) are required" });
  }

  const startTime = Date.now();
  let rawText = "";
  let fileBuffer: Buffer;

  try {
    fileBuffer = Buffer.from(base64, "base64");
  } catch (err: any) {
    return res.status(400).json({ error: "Invalid base64 payload" });
  }

  // 1. Text Extraction
  try {
    if (name.endsWith(".pdf") || mimeType === "application/pdf") {
      const pdfData = await pdfParse(fileBuffer);
      rawText = pdfData.text;
    } else if (name.endsWith(".docx") || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const docxData = await mammoth.extractRawText({ buffer: fileBuffer });
      rawText = docxData.value;
    } else {
      // Plain text fallback
      rawText = fileBuffer.toString("utf-8");
    }

    if (!rawText || !rawText.trim()) {
      throw new Error("No text content could be extracted from this document.");
    }
  } catch (extractError: any) {
    // Log failure
    const logs = readLogs();
    logs.push({
      id: `log_${Date.now()}`,
      action: "PARSE",
      filename: name,
      candidateName: "Unknown",
      status: "FAILED",
      details: `Extraction failed: ${extractError.message}`,
      timestamp: new Date().toISOString(),
    });
    writeLogs(logs);

    return res.status(500).json({ error: `Text extraction failed: ${extractError.message}` });
  }

  // Local backup analysis (Regex-based)
  const regexEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const regexPhone = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const regexLinkedin = /linkedin\.com\/in\/[a-zA-Z0-9_-]+/;
  const regexGithub = /github\.com\/[a-zA-Z0-9_-]+/;

  const localEmail = rawText.match(regexEmail)?.[0] || "";
  const localPhone = rawText.match(regexPhone)?.[0] || "";
  const localLinkedin = rawText.match(regexLinkedin)?.[0] || "";
  const localGithub = rawText.match(regexGithub)?.[0] || "";

  // Perform Skills lookup locally from static DB
  const matchedSkills = SKILLS_DATABASE.filter(skill => {
    const rx = new RegExp(`\\b${skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    return rx.test(rawText);
  });

  let parsedProfile: any = {
    name: name.split(".")[0].replace(/[-_]/g, " "),
    email: localEmail,
    phone: localPhone,
    linkedin: localLinkedin,
    github: localGithub,
    skills: matchedSkills,
    education: [],
    experience: [],
    certifications: [],
    address: "",
    summary: "Extracted profile text locally."
  };

  // 2. Duplicate Check
  const candidates = readCandidates();
  if (localEmail) {
    const duplicateIndex = candidates.findIndex(
      (c) => c.email.toLowerCase() === localEmail.toLowerCase()
    );

    if (duplicateIndex !== -1 && !overwrite) {
      // Return warning
      return res.json({
        duplicate: true,
        candidate: candidates[duplicateIndex],
        message: `Candidate with email ${localEmail} already exists.`,
      });
    }
  }

  // 3. AI NLP Enhancement using Gemini
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze the following raw resume text and extract structured profile details. Map certifications, experiences, skills, education and personal details cleanly.
        Ensure you cross-match skills with technical terms. Here is the raw resume text:\n\n${rawText}`,
        config: {
          systemInstruction: "You are an expert NLP Resume Parsing model. Analyze resume texts and extract structured entities accurately into JSON format. Do not create fake data.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Candidate's full name" },
              email: { type: Type.STRING, description: "Email address" },
              phone: { type: Type.STRING, description: "Phone/contact number" },
              linkedin: { type: Type.STRING, description: "LinkedIn profile URL" },
              github: { type: Type.STRING, description: "GitHub profile URL" },
              skills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of technical, language, framework, database, and soft skills."
              },
              education: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of schools, degrees, programs, and graduation years."
              },
              experience: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of company names, roles, duration, and key bullet points."
              },
              certifications: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Professional courses, credentials, or badges."
              },
              address: { type: Type.STRING, description: "Candidate home or professional address/location" },
              summary: { type: Type.STRING, description: "Brief high-level pitch summary of candidate profile" }
            },
            required: ["name", "email", "phone", "skills", "education", "experience", "certifications", "address", "summary"]
          }
        }
      });

      const textResult = response.text;
      if (textResult) {
        const aiParsed = JSON.parse(textResult.trim());
        // Merge or replace
        parsedProfile = {
          ...parsedProfile,
          ...aiParsed,
          // Ensure arrays are kept
          skills: Array.isArray(aiParsed.skills) && aiParsed.skills.length > 0 ? aiParsed.skills : parsedProfile.skills,
          education: Array.isArray(aiParsed.education) ? aiParsed.education : [],
          experience: Array.isArray(aiParsed.experience) ? aiParsed.experience : [],
          certifications: Array.isArray(aiParsed.certifications) ? aiParsed.certifications : []
        };
      }
    } catch (aiError: any) {
      console.error("Gemini Parsing error, falling back to local extraction:", aiError);
      // We will continue with the regex-parsed profile
    }
  }

  // Ensure fields are clean and normalized
  parsedProfile.id = parsedProfile.email ? `candidate_${Buffer.from(parsedProfile.email).toString("hex").slice(0, 12)}` : `candidate_${Date.now()}`;
  parsedProfile.created_at = new Date().toISOString();
  parsedProfile.raw_text = rawText;
  parsedProfile.resume_file = {
    name,
    size,
    mimeType,
    uploadedAt: new Date().toISOString()
  };

  // If duplicate and overwrite is accepted, replace existing
  const duplicateIndex = parsedProfile.email 
    ? candidates.findIndex((c) => c.email.toLowerCase() === parsedProfile.email.toLowerCase())
    : -1;

  if (duplicateIndex !== -1) {
    // Keep old ID to preserve history linkages
    parsedProfile.id = candidates[duplicateIndex].id;
    candidates[duplicateIndex] = parsedProfile;
  } else {
    candidates.push(parsedProfile);
  }

  writeCandidates(candidates);

  // Write success log
  const logs = readLogs();
  logs.push({
    id: `log_${Date.now()}`,
    action: "PARSE",
    filename: name,
    candidateName: parsedProfile.name,
    status: "SUCCESS",
    details: duplicateIndex !== -1 ? `Overwrote candidate profile for ${parsedProfile.name}` : `Parsed and created profile for ${parsedProfile.name}`,
    timestamp: new Date().toISOString(),
  });
  writeLogs(logs);

  res.json({
    success: true,
    candidate: parsedProfile,
    timeTakenMs: Date.now() - startTime
  });
});

// Setup Vite Dev Server / Serve static frontend files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
