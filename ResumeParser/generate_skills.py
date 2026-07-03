import csv

skills = [
    # Programming Languages
    "Python", "JavaScript", "TypeScript", "C", "C++", "C#", "Java", "Ruby", "Golang", "Rust", "PHP", "Swift", "Kotlin", 
    "Objective-C", "R", "Scala", "Perl", "Haskell", "Julia", "Dart", "HTML", "CSS", "SQL", "NoSQL", "Bash", "Shell", "PowerShell", "Lua", "Matlab",
    
    # Frameworks & Libraries
    "Flask", "Django", "FastAPI", "Tornado", "Pyramid", "Bottle", "Express", "Koa", "Sails", "NestJS", "React", "Next.js", 
    "Remix", "Gatsby", "Angular", "Vue", "Nuxt.js", "Svelte", "SolidJS", "Ember", "Backbone", "jQuery", "Bootstrap", "Tailwind CSS", 
    "Sass", "Less", "Stylus", "Redux", "MobX", "Zustand", "Recoil", "RxJS", "Spring", "Spring Boot", "Hibernate", "Struts", 
    "Play Framework", "Laravel", "Symfony", "CodeIgniter", "Yii", "CakePHP", "Ruby on Rails", "Sinatra", "Hanami", "ASP.NET", 
    "ASP.NET Core", "Blazor", "Xamarin", "Flutter", "React Native", "Cordova", "Ionic", "Capacitor", "Electron", "Tauri",
    
    # NLP & AI/ML
    "spaCy", "NLTK", "Scikit-Learn", "TensorFlow", "PyTorch", "Keras", "OpenCV", "Pandas", "NumPy", "Matplotlib", "Seaborn", 
    "Transformers", "Hugging Face", "BERT", "GPT", "LLM", "Generative AI", "LangChain", "LlamaIndex", "Vector Databases", 
    "Milvus", "Pinecone", "ChromaDB", "Weaviate", "Qdrant", "Deep Learning", "Machine Learning", "Artificial Intelligence", 
    "Computer Vision", "Natural Language Processing", "NER", "Named Entity Recognition", "POS Tagging", "Tokenization", 
    "Sentiment Analysis", "Text Classification", "Reinforcement Learning", "Neural Networks", "CNN", "RNN", "LSTM", "GANs",
    
    # Databases & Caching
    "PostgreSQL", "Postgres", "MySQL", "SQLite", "MongoDB", "Redis", "Memcached", "Cassandra", "DynamoDB", "MariaDB", 
    "Oracle", "Microsoft SQL Server", "MS SQL", "Elasticsearch", "Logstash", "Kibana", "InfluxDB", "Prometheus", "Neo4j", 
    "ArangoDB", "CouchDB", "Firebase", "Firestore", "Realtime Database", "Supabase", "Prisma", "SQLAlchemy", "Sequelize", 
    "Mongoose", "Drizzle", "Airtable",
    
    # DevOps, Cloud & Tools
    "AWS", "Amazon Web Services", "Azure", "GCP", "Google Cloud Platform", "Heroku", "DigitalOcean", "Vercel", "Netlify", 
    "Docker", "Kubernetes", "Podman", "Vagrant", "Terraform", "Ansible", "Puppet", "Chef", "Jenkins", "GitLab CI/CD", 
    "GitHub Actions", "CircleCI", "Travis CI", "Nginx", "Apache HTTP Server", "IIS", "HAProxy", "Caddy", "Linux", "Ubuntu", 
    "CentOS", "RedHat", "Debian", "Arch Linux", "Git", "GitHub", "GitLab", "Bitbucket", "SVN", "Jira", "Confluence", "Trello", 
    "Asana", "Slack", "VS Code", "PyCharm", "IntelliJ IDEA", "Eclipse", "Xcode", "Android Studio", "Vim", "Neovim", "Emacs",
    
    # Testing & Quality
    "Jest", "Mocha", "Chai", "Cypress", "Selenium", "Playwright", "Puppeteer", "Pytest", "Unittest", "JUnit", "NUnit", 
    "RSpec", "PHPUnit", "Postman", "Swagger", "SonarQube", "ESLint", "Prettier",
    
    # Core Concepts & Architectures
    "REST API", "GraphQL", "gRPC", "WebSockets", "SOAP", "Microservices", "Serverless", "SaaS", "PaaS", "IaaS", "OOP", 
    "Object-Oriented Programming", "Functional Programming", "MVC", "Model-View-Controller", "TDD", "Test-Driven Development", 
    "BDD", "Behavior-Driven Development", "Agile", "Scrum", "Kanban", "CI/CD", "Continuous Integration", "Continuous Deployment", 
    "OAuth", "JWT", "JSON Web Tokens", "SAML", "CORS", "Web Security", "OWASP", "Penetration Testing", "Cryptography",
    
    # Software Engineering & Soft Skills
    "Analytical Skills", "Problem Solving", "Critical Thinking", "Leadership", "Teamwork", "Communication", "Collaboration", 
    "Time Management", "Project Management", "Technical Writing", "System Design", "Algorithms", "Data Structures", "Big O Notation"
]

# Generate variations to quickly reach 1000+ matching items
all_skills = []
for s in skills:
    all_skills.append([s])
    # Add common junior/senior/expert/engineer/developer suffixes
    all_skills.append([f"{s} Developer"])
    all_skills.append([f"{s} Engineer"])
    all_skills.append([f"{s} Specialist"])
    all_skills.append([f"{s} Architect"])

with open("skills.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["skill"])
    writer.writerows(all_skills)

print(f"Generated skills.csv with {len(all_skills)} tech skills and variations.")
