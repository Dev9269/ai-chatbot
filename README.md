<div align="center">

# 🤖 AI Chatbot

[![Stars](https://img.shields.io/github/stars/Dev9269/ai-chatbot?style=flat-square&logo=github&color=gold)](https://github.com/Dev9269/ai-chatbot)
[![Forks](https://img.shields.io/github/forks/Dev9269/ai-chatbot?style=flat-square&logo=github&color=blue)](https://github.com/Dev9269/ai-chatbot/forks)
[![License](https://img.shields.io/github/license/Dev9269/ai-chatbot?style=flat-square&color=brightgreen)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square)](https://github.com/Dev9269/ai-chatbot/pulls)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Dev9269.github.io-0891b2?style=flat-square&logo=githubpages&logoColor=white)](https://dev9269.github.io/ai-chatbot/)

A smart AI chatbot with Groq AI (Llama 3.3 70B) and Unsplash image integration.

**Created by** [Jainam Maru](https://github.com/Dev9269)

**🌐 Live:** [dev9269.github.io/ai-chatbot](https://dev9269.github.io/ai-chatbot/)

</div>

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
git clone https://github.com/Dev9269/ai-chatbot.git
cd ai-chatbot
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
├── index.html          → UI structure
├── style.css           → All styling
├── app.js              → Frontend logic
├── api.js              → Talks to Python backend
├── server.py           → Python backend (Groq + Unsplash)
├── .env                → Your API keys (NOT on GitHub)
├── .env.example        → Template for others to fill in
├── .gitignore          → Blocks .env from GitHub
├── .dockerignore       → Files excluded from Docker build
├── Dockerfile          → Container build instructions
├── requirements.txt    → Python dependencies
└── .github/
    ├── FUNDING.yml     → Sponsor links
    └── workflows/
        ├── ci.yml      → Lint check on push/PR
        └── deploy.yml  → GitHub Pages deployment
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

## 🚢 Deployment

### GitHub Pages (Frontend)

The frontend (`index.html`, `style.css`, `app.js`) is automatically deployed to GitHub Pages via the `deploy.yml` workflow on every push to `master`.

### Docker Deployment

```bash
# Build the image
docker build -t ai-chatbot .

# Run the container
docker run -d -p 5000:5000 --env-file .env ai-chatbot
```

Or using Docker Compose:

```yaml
services:
  chatbot:
    build: .
    ports:
      - "5000:5000"
    env_file: .env
    restart: unless-stopped
```

### Manual Server Deployment

```bash
# Install dependencies
python -m pip install -r requirements.txt

# Set environment variables
export GROQ_KEY=your_groq_api_key
export UNSPLASH_KEY=your_unsplash_access_key

# Start the server
python server.py
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_KEY` | Yes | Groq API key for Llama 3.3 70B |
| `UNSPLASH_KEY` | Yes | Unsplash API access key |

### Production Considerations

- Use a reverse proxy (nginx/Caddy) in front of the Python backend
- Enable HTTPS with Let's Encrypt
- Set `PYTHONUNBUFFERED=1` for proper log streaming
- Monitor with `--workers 2` for handling concurrent requests

## 🔗 Connect
- Instagram → https://www.instagram.com/jainammaru_/
- GitHub → https://github.com/dev9269
- LinkedIn → https://www.linkedin.com/in/jainam-maru-007803386/
