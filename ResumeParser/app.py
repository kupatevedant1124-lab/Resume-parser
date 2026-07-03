import os
from flask import Flask, render_react, render_template, request, jsonify, send_file, redirect, url_for
from werkzeug.utils import secure_filename
import json

from database import db_session, init_db
from models import Candidate
from parser import ResumeParser
from extractor import InfoExtractor

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
app.config['ALLOWED_EXTENSIONS'] = {'pdf', 'docx'}
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB limit

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize Extractor with skills.csv database path
SKILLS_CSV = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'skills.csv')
extractor = InfoExtractor(skills_csv_path=SKILLS_CSV)

# Teardown database sessions
@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Initialize Database
try:
    init_db()
    print("Database tables initialized successfully.")
except Exception as e:
    print(f"Error initializing database: {e}. SQLite fallback will be used if PostgreSQL is offline.")

# ROUTES

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard_view():
    return render_template('dashboard.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in request"}), 400
        
    file = request.files['file']
    overwrite = request.form.get('overwrite', 'false').lower() == 'true'
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Rename file if it already exists to avoid collisions
        base, ext = os.path.splitext(filename)
        unique_filename = filename
        counter = 1
        while os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)):
            unique_filename = f"{base}_{counter}{ext}"
            counter += 1
            
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        
        try:
            # 1. Parse Text
            raw_text = ResumeParser.extract_text(file_path)
            if not raw_text.strip():
                os.remove(file_path)
                return jsonify({"error": "Empty or unparseable resume file"}), 400
                
            # 2. Extract Entities using spaCy + Regex
            extracted_data = extractor.extract_all(raw_text)
            
            # 3. Duplicate Detection based on Email
            email = extracted_data.get("email")
            existing_candidate = None
            if email:
                existing_candidate = Candidate.query.filter_by(email=email).first()
                
            if existing_candidate:
                if not overwrite:
                    # Cleanup uploaded file since we're not overwriting
                    os.remove(file_path)
                    return jsonify({
                        "duplicate": True,
                        "message": f"Candidate with email {email} already exists.",
                        "candidate": existing_candidate.to_dict()
                    }), 200
                else:
                    # Remove old file if it exists
                    if existing_candidate.resume_file and os.path.exists(existing_candidate.resume_file):
                        try:
                            os.remove(existing_candidate.resume_file)
                        except OSError:
                            pass
                    # Overwrite existing
                    existing_candidate.name = extracted_data["name"]
                    existing_candidate.phone = extracted_data["phone"]
                    existing_candidate.education = extracted_data["education"]
                    existing_candidate.experience = extracted_data["experience"]
                    existing_candidate.skills = extracted_data["skills"]
                    existing_candidate.address = extracted_data["address"]
                    existing_candidate.resume_file = file_path
                    db_session.commit()
                    return jsonify({
                        "success": True,
                        "message": "Candidate profile updated successfully.",
                        "candidate": existing_candidate.to_dict()
                    })

            # Create new Candidate
            candidate = Candidate(
                name=extracted_data["name"],
                email=extracted_data["email"],
                phone=extracted_data["phone"],
                education=extracted_data["education"],
                experience=extracted_data["experience"],
                skills=extracted_data["skills"],
                address=extracted_data["address"],
                resume_file=file_path
            )
            
            db_session.add(candidate)
            db_session.commit()
            
            return jsonify({
                "success": True,
                "message": "Resume uploaded and parsed successfully.",
                "candidate": candidate.to_dict()
            }), 201
            
        except Exception as e:
            # Clean up file on failure
            if os.path.exists(file_path):
                os.remove(file_path)
            print(f"Error parsing resume: {e}")
            return jsonify({"error": f"Internal parsing error: {str(e)}"}), 500
    else:
        return jsonify({"error": "Unsupported file format. Please upload PDF or DOCX"}), 400

@app.route('/candidates', methods=['GET'])
def get_candidates():
    query = request.args.get('q', '').strip().lower()
    try:
        candidates = Candidate.query.order_by(Candidate.created_at.desc()).all()
        candidate_dicts = [c.to_dict() for c in candidates]
        
        if not query:
            return jsonify(candidate_dicts)
            
        filtered = []
        for c in candidate_dicts:
            # Simple keyword matching across fields
            skills_str = " ".join(c["skills"]).lower()
            edu_str = " ".join(c["education"]).lower()
            exp_str = " ".join(c["experience"]).lower()
            if (query in c["name"].lower() or 
                query in (c["email"] or '').lower() or 
                query in (c["phone"] or '').lower() or 
                query in (c["address"] or '').lower() or
                query in skills_str or
                query in edu_str or
                query in exp_str):
                filtered.append(c)
                
        return jsonify(filtered)
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/candidate/<int:cid>', methods=['GET'])
def get_candidate(cid):
    candidate = Candidate.query.get(cid)
    if not candidate:
        return jsonify({"error": "Candidate not found"}), 404
    return jsonify(candidate.to_dict())

@app.route('/candidate/<int:cid>', methods=['DELETE'])
def delete_candidate(cid):
    candidate = Candidate.query.get(cid)
    if not candidate:
        return jsonify({"error": "Candidate not found"}), 404
        
    try:
        # Delete resume file
        if candidate.resume_file and os.path.exists(candidate.resume_file):
            try:
                os.remove(candidate.resume_file)
            except OSError:
                pass
                
        db_session.delete(candidate)
        db_session.commit()
        return jsonify({"success": True, "message": "Candidate profile deleted successfully."})
    except Exception as e:
        db_session.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/download/<int:cid>', methods=['GET'])
def download_profile(cid):
    candidate = Candidate.query.get(cid)
    if not candidate:
        return jsonify({"error": "Candidate not found"}), 404
        
    # Write JSON data to a temp file or construct download response
    candidate_data = candidate.to_dict()
    temp_file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"candidate_{cid}_profile.json")
    
    with open(temp_file_path, 'w') as f:
        json.dump(candidate_data, f, indent=4)
        
    response = send_file(
        temp_file_path,
        mimetype='application/json',
        as_attachment=True,
        download_name=f"candidate_{candidate.name.replace(' ', '_')}_profile.json"
    )
    
    # Simple clean up of temp file after sending can be done if desired
    return response

# API endpoint for dashboard metrics
@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        candidates = Candidate.query.all()
        total_candidates = len(candidates)
        
        # Skill Counts
        skill_counts = {}
        total_skills = 0
        for c in candidates:
            skills_list = c.skills or []
            total_skills += len(skills_list)
            for skill in skills_list:
                skill_norm = skill.strip().title()
                skill_counts[skill_norm] = skill_counts.get(skill_norm, 0) + 1
                
        top_skills = sorted(
            [{"name": k, "count": v} for k, v in skill_counts.items()],
            key=lambda x: x["count"],
            reverse=True
        )[:10]
        
        avg_skills = round(total_skills / total_candidates, 1) if total_candidates > 0 else 0
        
        # Experience breakdown
        exp_levels = {"Junior (0-2 jobs)": 0, "Mid-Level (3-4 jobs)": 0, "Senior (5+ jobs)": 0}
        for c in candidates:
            jobs_count = len(c.experience or [])
            if jobs_count <= 2:
                exp_levels["Junior (0-2 jobs)"] += 1
            elif jobs_count <= 4:
                exp_levels["Mid-Level (3-4 jobs)"] += 1
            else:
                exp_levels["Senior (5+ jobs)"] += 1
                
        experience_distribution = [{"name": k, "value": v} for k, v in exp_levels.items()]
        
        return jsonify({
            "totalCandidates": total_candidates,
            "avgSkills": avg_skills,
            "topSkills": top_skills,
            "experienceDistribution": experience_distribution
        })
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
