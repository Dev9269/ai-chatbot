# 🤖 AI Chatbot

<p align="left">
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python" />
  <img src="https://img.shields.io/badge/Flask-3.0-000000?style=flat-square&logo=flask" />
  <img src="https://img.shields.io/badge/Groq_AI-Llama_3.3-FF6600?style=flat-square" />
  <img src="https://img.shields.io/badge/Unsplash_API-000000?style=flat-square&logo=unsplash" />
  <img src="https://img.shields.io/github/stars/Dev9269/ai-chatbot?style=flat-square&label=Stars" />
  <img src="https://img.shields.io/github/license/Dev9269/ai-chatbot?style=flat-square" />
</p>

A smart AI chatbot built with HTML, CSS, JavaScript and a Python backend.  
Built by [@Jainammaru](https://www.instagram.com/jainammaru_/)

---

## ✨ Features
- Chat with Groq AI (Llama 3.3 70B)
- Relevant images shown for every reply (Unsplash)
- Light / Dark mode
- Chat history saved in browser
- Clean, responsive UI

---

## 🚀 Setup

### 1. Clone the repo
```
git clone https://github.com/dev9269/your-repo-name.git
cd your-repo-name
```

### 2. Install Python dependencies
```
python -m pip install -r requirements.txt
```

### 3. Add your API keys
Copy the example env file:
```
cp .env.example .env
```
Then open `.env` and fill in your keys:
```
GROQ_KEY=your_groq_api_key_here
UNSPLASH_KEY=your_unsplash_access_key_here
```

Get your free API keys here:
- **Groq** → https://console.groq.com (free, fast AI)
- **Unsplash** → https://unsplash.com/developers (free, 50 req/hour)

### 4. Run the backend
```
python server.py
```

### 5. Open the chatbot
Open `index.html` in your browser (double-click or use Live Server in VS Code).

---

## 📁 Project Structure
```
├── index.html       → UI structure
├── style.css        → All styling
├── app.js           → Frontend logic
├── api.js           → Talks to Python backend
├── server.py        → Python backend (Groq + Unsplash)
├── .env             → Your API keys (NOT on GitHub)
├── .env.example     → Template for others to fill in
├── .gitignore       → Blocks .env from GitHub
└── requirements.txt → Python dependencies
```

---

## 🐳 Docker Deployment

```bash
# Build the image
docker build -t ai-chatbot .

# Run the container
docker run -d -p 5000:5000 --env-file .env ai-chatbot
```

Or use with Docker Compose:

```yaml
services:
  chatbot:
    build: .
    ports:
      - "5000:5000"
    env_file: .env
    restart: unless-stopped
```

---

## 🔗 Connect
- Instagram → https://www.instagram.com/jainammaru_/
- GitHub → https://github.com/dev9269
- LinkedIn → https://www.linkedin.com/in/jainam-maru-007803386/
