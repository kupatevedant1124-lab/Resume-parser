import React, { useState } from "react";
import { Folder, FileCode, Copy, ClipboardCheck, ArrowDownToLine, Code2 } from "lucide-react";

export default function PythonCodebaseTab() {
  const [selectedFile, setSelectedFile] = useState("app.py");
  const [copied, setCopied] = useState(false);

  // Dictionary containing all the Python files we generated in /ResumeParser
  const pythonFiles: Record<string, { path: string; language: string; content: string }> = {
    "app.py": {
      path: "app.py",
      language: "python",
      content: `import os
from flask import Flask, render_template, request, jsonify, send_file
from werkzeug.utils import secure_filename
import json

from database import db_session, init_db
from models import Candidate
from parser import ResumeParser
from extractor import InfoExtractor

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
app.config['ALLOWED_EXTENSIONS'] = {'pdf', 'docx'}

# Ensure uploads directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize Extractor with skills.csv dictionary path
extractor = InfoExtractor(skills_csv_path='skills.csv')

@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()

# Initialize PostgreSQL database
init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    overwrite = request.form.get('overwrite', 'false').lower() == 'true'
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        try:
            # 1. Extract text
            raw_text = ResumeParser.extract_text(file_path)
            
            # 2. Parse NLP Entities
            data = extractor.extract_all(raw_text)
            
            # 3. Handle Duplicates
            email = data.get("email")
            if email:
                existing = Candidate.query.filter_by(email=email).first()
                if existing and not overwrite:
                    os.remove(file_path)
                    return jsonify({"duplicate": True, "message": "Email already exists.", "candidate": existing.to_dict()})
                elif existing and overwrite:
                    # Overwrite profile
                    existing.name = data["name"]
                    existing.phone = data["phone"]
                    existing.skills = data["skills"]
                    existing.education = data["education"]
                    existing.experience = data["experience"]
                    existing.address = data["address"]
                    db_session.commit()
                    return jsonify({"success": True, "candidate": existing.to_dict()})
            
            candidate = Candidate(
                name=data["name"], email=data["email"], phone=data["phone"],
                skills=data["skills"], education=data["education"],
                experience=data["experience"], address=data["address"],
                resume_file=file_path
            )
            db_session.add(candidate)
            db_session.commit()
            return jsonify({"success": True, "candidate": candidate.to_dict()}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    return jsonify({"error": "File type not allowed"}), 400
`
    },
    "extractor.py": {
      path: "extractor.py",
      language: "python",
      content: `import re
import spacy
import pandas as pd

class InfoExtractor:
    def __init__(self, skills_csv_path=None):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            self.nlp = None
            print("Run 'python -m spacy download en_core_web_sm'")
        
        self.skills_db = set()
        if skills_csv_path:
            try:
                df = pd.read_csv(skills_csv_path)
                self.skills_db = set(df['skill'].str.lower().str.strip().tolist())
            except Exception:
                pass

    def extract_email(self, text):
        match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', text)
        return match.group(0) if match else ""

    def extract_phone(self, text):
        match = re.search(r'(\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}', text)
        return match.group(0) if match else ""

    def extract_name(self, text):
        if self.nlp:
            doc = self.nlp(text[:1000])
            for ent in doc.ents:
                if ent.label_ == "PERSON" and len(ent.text.split()) >= 2:
                    return ent.text.strip()
        return "Unknown Candidate"
`
    },
    "models.py": {
      path: "models.py",
      language: "python",
      content: `import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=True, index=True)
    phone = Column(String(30), nullable=True)
    education = Column(JSON, nullable=True)
    experience = Column(JSON, nullable=True)
    skills = Column(JSON, nullable=True)
    address = Column(Text, nullable=True)
    resume_file = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "education": self.education or [],
            "experience": self.experience or [],
            "skills": self.skills or [],
            "address": self.address or "",
            "resume_file": self.resume_file
        }
`
    },
    "parser.py": {
      path: "parser.py",
      language: "python",
      content: `import os
import pdfplumber
import docx

class ResumeParser:
    @staticmethod
    def extract_text_from_pdf(file_path):
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\\n"
        return text

    @staticmethod
    def extract_text_from_docx(file_path):
        doc = docx.Document(file_path)
        return "\\n".join([para.text for para in doc.paragraphs])

    @classmethod
    def extract_text(cls, file_path):
        _, ext = os.path.splitext(file_path.lower())
        if ext == '.pdf':
            return cls.extract_text_from_pdf(file_path)
        elif ext == '.docx':
            return cls.extract_text_from_docx(file_path)
        raise ValueError(f"Unsupported ext: {ext}")
`
    },
    "database.py": {
      path: "database.py",
      language: "python",
      content: `import os
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/resume_parser")

engine = create_engine(DATABASE_URL)
db_session = scoped_session(sessionmaker(bind=engine))

Base = declarative_base()
Base.query = db_session.query_property()

def init_db():
    import models
    Base.metadata.create_all(bind=engine)
`
    },
    "requirements.txt": {
      path: "requirements.txt",
      language: "txt",
      content: `Flask==3.0.2
spacy==3.7.4
pdfplumber==0.11.0
python-docx==1.1.0
SQLAlchemy==2.0.28
psycopg2-binary==2.9.9
pandas==2.2.1
`
    },
    "README.md": {
      path: "README.md",
      language: "markdown",
      content: `# AI Resume Parser (Internship Submission Project)

Fully functional parser built using Flask, spaCy NER pipelines, and PostgreSQL.

### Execution Instructions:

1. Create Python 3.12 Virtual environment:
   \`\`\`bash
   python3 -m venv venv
   source venv/bin/activate
   \`\`\`

2. Install dependencies & spaCy language model:
   \`\`\`bash
   pip install -r requirements.txt
   python -m spacy download en_core_web_sm
   \`\`\`

3. Configure your database:
   Create a PostgreSQL database named \`resume_parser\` and expose \`DATABASE_URL\` environmental variable.

4. Run development Flask server:
   \`\`\`bash
   python app.py
   \`\`\`
`
    }
  };

  const copyCode = () => {
    const file = pythonFiles[selectedFile];
    if (!file) return;
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-500" />
            Python Source Codebase
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Browse and inspect the pre-constructed Python codebase files generated in your `/ResumeParser` workspace folder.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Code tree navigator */}
        <div className="md:col-span-3 bg-slate-50 p-4 rounded-xl border space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            <Folder className="w-4 h-4 inline-block text-yellow-500 mr-1.5" />
            ResumeParser/
          </span>
          <div className="flex flex-col gap-1.5 pl-4">
            {Object.keys(pythonFiles).map((filename) => {
              const active = selectedFile === filename;
              return (
                <button
                  key={filename}
                  onClick={() => {
                    setSelectedFile(filename);
                    setCopied(false);
                  }}
                  className={`text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <FileCode className={`w-3.5 h-3.5 ${active ? "text-white" : "text-slate-400"}`} />
                  {filename}
                </button>
              );
            })}
          </div>
        </div>

        {/* Code viewer console */}
        <div className="md:col-span-9 bg-slate-900 rounded-xl p-5 border border-slate-800 text-slate-300 flex flex-col h-[520px] shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
            <span className="font-mono text-xs text-slate-400">
              📁 ResumeParser / {pythonFiles[selectedFile].path}
            </span>
            <button
              onClick={copyCode}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              {copied ? (
                <>
                  <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  Copy File
                </>
              )}
            </button>
          </div>

          <div className="flex-grow overflow-auto font-mono text-xs text-emerald-400 leading-relaxed bg-slate-950 p-4 rounded-lg select-text scrollbar-thin">
            <pre>{pythonFiles[selectedFile].content}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
