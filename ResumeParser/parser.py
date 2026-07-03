import os
import pdfplumber
import docx

class ResumeParser:
    @staticmethod
    def extract_text_from_pdf(file_path):
        """Extracts raw text from a PDF file using pdfplumber."""
        text = ""
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            print(f"Error reading PDF {file_path}: {e}")
        return text

    @staticmethod
    def extract_text_from_docx(file_path):
        """Extracts raw text from a DOCX file using python-docx."""
        text = ""
        try:
            doc = docx.Document(file_path)
            full_text = []
            for para in doc.paragraphs:
                full_text.append(para.text)
            text = "\n".join(full_text)
        except Exception as e:
            print(f"Error reading DOCX {file_path}: {e}")
        return text

    @classmethod
    def extract_text(cls, file_path):
        """Extracts text based on the file extension."""
        _, ext = os.path.splitext(file_path.lower())
        if ext == '.pdf':
            return cls.extract_text_from_pdf(file_path)
        elif ext in ['.docx', '.doc']:
            return cls.extract_text_from_docx(file_path)
        else:
            raise ValueError(f"Unsupported file format: {ext}")
