import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=True, index=True)
    phone = Column(String(30), nullable=True)
    education = Column(JSON, nullable=True)  # Stores list of education history
    experience = Column(JSON, nullable=True)  # Stores list of work experiences
    skills = Column(JSON, nullable=True)  # Stores list of skills
    address = Column(Text, nullable=True)
    resume_file = Column(String(255), nullable=False)  # Stores relative path of the file
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
            "resume_file": self.resume_file,
            "created_at": self.created_at.isoformat() if self.created_at else ""
        }
