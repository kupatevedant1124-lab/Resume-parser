import re
import os
import spacy
import pandas as pd

class InfoExtractor:
    def __init__(self, skills_csv_path=None):
        # Load spaCy English model (will fail gracefully if not installed yet)
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            # Fallback mock or empty pipeline
            self.nlp = None
            print("Warning: spaCy en_core_web_sm model not found. Run 'python -m spacy download en_core_web_sm'")

        # Load skills database
        self.skills_db = set()
        if skills_csv_path and os.path.exists(skills_csv_path):
            try:
                df = pd.read_csv(skills_csv_path)
                if 'skill' in df.columns:
                    self.skills_db = set(df['skill'].str.lower().str.strip().tolist())
                elif not df.empty:
                    # Fallback to the first column
                    self.skills_db = set(df.iloc[:, 0].str.lower().str.strip().tolist())
            except Exception as e:
                print(f"Error loading skills CSV: {e}")
        
        # Default fallback skills if CSV is empty or not found
        if not self.skills_db:
            self.skills_db = {
                "python", "flask", "django", "fastapi", "javascript", "typescript", "node.js", "express",
                "react", "angular", "vue", "html", "css", "bootstrap", "tailwind", "postgresql", "mysql",
                "sqlite", "mongodb", "redis", "docker", "kubernetes", "aws", "azure", "gcp", "git", "github",
                "spacy", "nltk", "nlp", "machine learning", "deep learning", "tensorflow", "pytorch", "pandas",
                "numpy", "scikit-learn", "scrum", "agile", "project management", "rest api", "graphql"
            }

    def extract_email(self, text):
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        match = re.search(email_pattern, text)
        return match.group(0) if match else ""

    def extract_phone(self, text):
        phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        match = re.search(phone_pattern, text)
        return match.group(0) if match else ""

    def extract_linkedin(self, text):
        pattern = r'linkedin\.com\/in\/[a-zA-Z0-9_-]+'
        match = re.search(pattern, text, re.IGNORECASE)
        return f"https://{match.group(0)}" if match else ""

    def extract_github(self, text):
        pattern = r'github\.com\/[a-zA-Z0-9_-]+'
        match = re.search(pattern, text, re.IGNORECASE)
        return f"https://{match.group(0)}" if match else ""

    def extract_name(self, text):
        """Extracts Name using spaCy NER PERSON tag or heuristics."""
        if self.nlp:
            doc = self.nlp(text[:1000])  # Scan first 1000 characters for name
            for ent in doc.ents:
                if ent.label_ == "PERSON" and len(ent.text.split()) >= 2:
                    # Clean and return first valid person entity
                    name = ent.text.strip().replace("\n", " ")
                    if not any(char.isdigit() for char in name):
                        return name
        
        # Fallback Heuristic: First non-empty line
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        if lines:
            first_line = lines[0]
            if len(first_line.split()) >= 2 and len(first_line) < 50:
                return first_line
        return "Unknown Candidate"

    def extract_skills(self, text):
        """Extract skills based on token boundaries matching the skills database."""
        matched_skills = []
        text_lower = text.lower()
        
        # Simple phrase matching
        for skill in self.skills_db:
            # Escape skill for safe regex boundary matching
            escaped = re.escape(skill)
            pattern = rf"\b{escaped}\b"
            if re.search(pattern, text_lower):
                matched_skills.append(skill.title())
                
        return sorted(list(set(matched_skills)))

    def extract_sections(self, text):
        """Helper to break resume into common sections like Education, Experience, etc."""
        sections = {
            "education": [],
            "experience": [],
            "certifications": [],
            "address": ""
        }
        
        lines = text.split("\n")
        current_section = None
        
        # Patterns for section headers
        edu_headers = re.compile(r'\b(education|university|college|academic|degrees|qualification)\b', re.I)
        exp_headers = re.compile(r'\b(experience|employment|work|history|jobs|professional background)\b', re.I)
        cert_headers = re.compile(r'\b(certifications|certs|credentials|courses|awards)\b', re.I)
        
        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
                
            # Check if line is a header
            if len(line_str) < 30:
                if edu_headers.search(line_str):
                    current_section = "education"
                    continue
                elif exp_headers.search(line_str):
                    current_section = "experience"
                    continue
                elif cert_headers.search(line_str):
                    current_section = "certifications"
                    continue
            
            # Add line to current active section
            if current_section and len(line_str) > 3:
                sections[current_section].append(line_str)

        # Address detection using spaCy GPE, FAC, or simple regex
        if self.nlp:
            doc = self.nlp(text[:1500])
            locations = []
            for ent in doc.ents:
                if ent.label_ in ["GPE", "LOC", "FAC"]:
                    locations.append(ent.text.strip())
            if locations:
                sections["address"] = ", ".join(list(set(locations))[:3])
                
        # Regex address fallback
        if not sections["address"]:
            address_pattern = re.compile(r'\b\d{1,5}\s+[A-Za-z0-9#\s,.\'\-]{5,50}\s+[A-Za-z]{2}\s+\d{5}\b')
            match = address_pattern.search(text)
            if match:
                sections["address"] = match.group(0)
            else:
                # Basic city/state pattern
                city_state = re.search(r'\b[A-Za-z\s]{3,20},\s+[A-Z]{2}\b', text)
                if city_state:
                    sections["address"] = city_state.group(0)
                    
        return sections

    def extract_all(self, text):
        sections = self.extract_sections(text)
        return {
            "name": self.extract_name(text),
            "email": self.extract_email(text),
            "phone": self.extract_phone(text),
            "linkedin": self.extract_linkedin(text),
            "github": self.extract_github(text),
            "skills": self.extract_skills(text),
            "education": sections["education"][:5] if sections["education"] else ["Graduate from local institute"],
            "experience": sections["experience"][:10] if sections["experience"] else ["Fresh developer entry"],
            "certifications": sections["certifications"][:4] if sections["certifications"] else [],
            "address": sections["address"] or "Not Specified"
        }
