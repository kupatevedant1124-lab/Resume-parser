# AI Resume Parser & Candidate Analytics Dashboard

A production-quality full-stack Resume Parser application. It parses, cleans, processes, and extracts structured entities from resumes (PDF and DOCX) using **spaCy Named Entity Recognition (NER)**, structured regular expressions, and high-accuracy text extraction engines.

## Technology Stack

-   **Backend**: Python 3.12, Flask, spaCy (NLP), PDFPlumber, python-docx
-   **Database**: PostgreSQL, SQLAlchemy ORM
-   **Frontend**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5

---

## Key Features

1.  **Multi-format Parser**: Extract and clean raw text from PDF and DOCX files.
2.  **Advanced NLP Engine**: Uses spaCy NER and regular expressions to extract:
    -   Candidate Name
    -   Email Address
    -   Phone Number
    -   Social Handles (LinkedIn, GitHub)
    -   Skills (Validated against a 1300+ skills library)
    -   Education history
    -   Work experience
    -   Certifications and credentials
    -   Locations and Address details
3.  **Durable Database Storage**: PostgreSQL schema built on top of SQLAlchemy.
4.  **Deduplication & Collision Logic**: Checks for existing emails, warning users and offering overwrite or merge options.
5.  **Interactive Searching & Filtering**: Filters candidates globally based on keyword matching.
6.  **Candidate Profile Download**: Export any parsed candidate's profile as a clean, standardized JSON file.
7.  **Analytics Dashboard**: Visualizes top skill frequencies, candidate counts, average resume strengths, and candidate experience distribution.

---

## Project Structure

```
ResumeParser/
│
├── app.py                     # Flask Main Application Routes & Controllers
├── parser.py                  # Core document text extraction (pdfplumber, docx)
├── extractor.py               # spaCy NER and Regex info-extraction logic
├── database.py                # SQLAlchemy DB Engine & scoped_session initializers
├── models.py                  # Candidate database models
├── requirements.txt           # Python dependency manifests
├── skills.csv                 # Pre-populated dictionary of 1300+ technical skills
├── generate_skills.py         # Script to populate/regenerate skills database
├── README.md                  # This setup guide
│
├── templates/
│      ├── index.html          # Candidates Database, Parser, and Search UI
│      └── dashboard.html      # Stats and graphs visual dashboard
│
└── static/
       ├── style.css           # Professional CSS UI stylings
       └── script.js           # AJAX operations, state management, and file processing
```

---

## Installation & Setup Guide

### 1. Prerequisite Packages
Make sure you have **Python 3.12** and **PostgreSQL** installed and running on your system.

### 2. Clone and Setup Environment
Navigate into the `ResumeParser/` directory and create a virtual environment:
```bash
cd ResumeParser
python3 -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
```

### 3. Install Dependencies
Install all required libraries specified in the requirements manifest, and download the pre-trained spaCy NLP core language model:
```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 4. Setup PostgreSQL Database
1. Create a database named `resume_parser` in PostgreSQL:
   ```sql
   CREATE DATABASE resume_parser;
   ```
2. Configure the database connection string. You can set the `DATABASE_URL` environment variable:
   - **Linux/macOS**:
     ```bash
     export DATABASE_URL="postgresql://<username>:<password>@localhost:5432/resume_parser"
     ```
   - **Windows (CMD)**:
     ```cmd
     set DATABASE_URL=postgresql://<username>:<password>@localhost:5432/resume_parser
     ```
   *(If not set, it defaults to: `postgresql://postgres:postgres@localhost:5432/resume_parser`)*

### 5. Running the Application
Launch the Flask development server:
```bash
python app.py
```
Open your browser and navigate to: `http://localhost:5000`

---

## Production Deployment Steps

1.  **Gunicorn WSGI Server**: For Unix systems, use Gunicorn to serve the Flask app in production instead of the built-in Flask development server:
    ```bash
    pip install gunicorn
    gunicorn -w 4 -b 0.0.0.0:5000 app:app
    ```
2.  **Nginx Reverse Proxy**: Place Nginx in front of Gunicorn to handle HTTPS encryption, client upload limits, and static asset caching.
3.  **Environment Secrets Management**: Ensure secrets (`DATABASE_URL`, security keys) are injected securely via system environments or cloud secret managers (AWS Secrets Manager, GCP Secret Manager) instead of committing them in files.
4.  **Database Migrations**: Integrate **Alembic** alongside SQLAlchemy to handle incremental schema changes gracefully in production database environments.
