export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  linkedin?: string;
  github?: string;
  skills: string[];
  education: string[];
  experience: string[];
  certifications: string[];
  address: string;
  summary: string;
  raw_text: string;
  resume_file: {
    name: string;
    size: number;
    mimeType: string;
    uploadedAt: string;
  };
  created_at: string;
}

export interface UploadLog {
  id: string;
  action: "PARSE" | "DELETE";
  filename: string;
  candidateName: string;
  status: "SUCCESS" | "FAILED";
  details: string;
  timestamp: string;
}

export interface DashboardStats {
  totalCandidates: number;
  avgSkills: number;
  topSkills: { name: string; count: number }[];
  experienceDistribution: { name: string; value: number }[];
  recentLogs: UploadLog[];
}
