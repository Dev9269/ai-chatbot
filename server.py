"""
server.py - Python Backend
--------------------------
This is the backend server for the AI Chatbot.
It handles two things:
  1. /api/chat   - Takes the user's message, sends it to Gemini AI, returns the reply
  2. /api/images - Takes a keyword, searches Unsplash, returns relevant photos

API keys are stored here safely and never sent to the browser.

How to run:
  python -m pip install -r requirements.txt
  python server.py
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
ALLOWED_ORIGINS = os.environ.get(
    "CORS_ORIGINS",
    "https://dev9269.github.io,https://ai-chatbot-1-401a.onrender.com",
).split(",")

CORS(app, origins=ALLOWED_ORIGINS)

FRONTEND_DIR = Path(__file__).parent


@app.route("/")
def serve_index():
    """Serve the main chatbot frontend (index.html)."""
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:filename>")
def serve_static(filename):
    """Serve static assets (CSS, JS, images, etc.)."""
    return send_from_directory(FRONTEND_DIR, filename)


@app.after_request
def add_security_headers(response):
    """Inject security headers into every HTTP response."""
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains"
    )
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# ---- API Keys (loaded from .env file, never hardcoded) ----

GEMINI_KEY = os.getenv("GEMINI_KEY")
UNSPLASH_KEY = os.getenv("UNSPLASH_KEY")

if not GEMINI_KEY or not UNSPLASH_KEY:
    import sys

    print(
        "ERROR: API keys missing. Copy .env.example to .env and add your keys.",
        file=sys.stderr,
    )
    sys.exit(1)


GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.0-flash-lite:generateContent"
)


# ---- AI Personality & Reply Style ----

SYSTEM_PROMPT = """You are a smart, friendly assistant. Follow these rules:
- Keep replies short, max 3 to 4 sentences for simple questions.
- Never write long paragraphs. Use bullet points if listing more than 2 things.
- Sound like a helpful friend, not a textbook or a robot.
- No filler phrases like Certainly, Of course, or Great question. Just answer directly.
- Use plain language. Avoid jargon unless the user uses it first."""


# ---- Route 1: Chat with AI ----


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON payload."}), 400

    history = data.get("history", [])
    message = data.get("message", "").strip()

    if not message:
        return jsonify({"error": "Message cannot be empty."}), 400

    if len(message) > 4000:
        return jsonify({"error": "Message too long (max 4000 characters)."}), 400

    # Build Gemini contents array from history
    contents = []
    for msg in history[-40:]:
        role = "model" if msg.get("role") == "assistant" else "user"
        contents.append({"role": role, "parts": [{"text": msg["content"]}]})
    contents.append({"role": "user", "parts": [{"text": message}]})

    payload = {
        "contents": contents,
        "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
    }

    try:
        response = requests.post(
            GEMINI_URL,
            headers={
                "Content-Type": "application/json",
                "X-goog-api-key": GEMINI_KEY,
            },
            json=payload,
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()
        reply = data["candidates"][0]["content"]["parts"][0]["text"]
        return jsonify({"reply": reply})

    except requests.exceptions.Timeout:
        return jsonify({"error": "AI took too long to respond. Please try again."}), 504
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---- Route 2: Fetch Images from Unsplash ----


@app.route("/api/images", methods=["GET"])
def images():
    query = request.args.get("q", "").strip()

    try:
        count = max(1, min(int(request.args.get("count", 4)), 12))
    except (ValueError, TypeError):
        count = 4

    if not query:
        return jsonify({"images": []})

    try:
        response = requests.get(
            "https://api.unsplash.com/search/photos",
            headers={"Authorization": f"Client-ID {UNSPLASH_KEY}"},
            params={"query": query, "per_page": count, "orientation": "squarish"},
            timeout=10,
        )
        response.raise_for_status()

        results = response.json().get("results", [])
        images = [
            {
                "thumb": img["urls"]["small"],
                "full": img["urls"]["regular"],
                "download": img["links"]["download"],
                "alt": img.get("alt_description") or query,
            }
            for img in results
        ]
        return jsonify({"images": images})

    except Exception as e:
        return jsonify({"images": [], "error": str(e)})


# ---- Start the Server ----

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
