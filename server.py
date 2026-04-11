# =============================================================
#  server.py  —  Python Backend for AI Chatbot
#
#  This handles ONLY the API calls (Groq + Unsplash).
#  The frontend (index.html) opens normally in the browser.
#
#  Setup:
#    pip install flask flask-cors requests
#    python server.py
#
#  Then open index.html directly in your browser as usual.
# =============================================================

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

load_dotenv()  # reads keys from .env file

app = Flask(__name__)
CORS(app)  # allows the browser frontend to call this backend

# ── API Keys (loaded from .env, never hardcoded) ──────────────
GROQ_KEY     = os.getenv('GROQ_KEY')
UNSPLASH_KEY = os.getenv('UNSPLASH_KEY')

if not GROQ_KEY or not UNSPLASH_KEY:
    raise Exception('Missing API keys! Copy .env.example to .env and fill in your keys.')

# ── AI reply style ────────────────────────────────────────────
SYSTEM_PROMPT = """You are a smart, friendly assistant. Follow these rules:
- Keep replies SHORT — max 3-4 sentences for simple questions.
- Never write long paragraphs. Use bullet points if listing more than 2 things.
- Sound like a helpful friend, not a textbook or a robot.
- No filler phrases like "Certainly!", "Of course!", "Great question!" — just answer directly.
- Use plain language. Avoid jargon unless the user uses it first."""


# ── /api/chat  —  get AI reply from Groq ─────────────────────
@app.route('/api/chat', methods=['POST'])
def chat():
    data    = request.json
    history = data.get('history', [])
    message = data.get('message', '').strip()

    if not message:
        return jsonify({'error': 'empty message'}), 400

    messages = [{'role': 'system', 'content': SYSTEM_PROMPT}] + history + [{'role': 'user', 'content': message}]

    try:
        res = requests.post(
            'https://api.groq.com/openai/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {GROQ_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'llama-3.3-70b-versatile',
                'messages': messages,
                'max_tokens': 300,
                'temperature': 0.7
            },
            timeout=15
        )
        res.raise_for_status()
        reply = res.json()['choices'][0]['message']['content']
        return jsonify({'reply': reply})

    except requests.exceptions.Timeout:
        return jsonify({'error': 'AI took too long, try again'}), 504
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── /api/images  —  fetch images from Unsplash ───────────────
@app.route('/api/images', methods=['GET'])
def images():
    query = request.args.get('q', '').strip()
    count = int(request.args.get('count', 4))

    if not query:
        return jsonify({'images': []})

    try:
        res = requests.get(
            'https://api.unsplash.com/search/photos',
            headers={'Authorization': f'Client-ID {UNSPLASH_KEY}'},
            params={'query': query, 'per_page': count, 'orientation': 'squarish'},
            timeout=10
        )
        res.raise_for_status()
        results = res.json().get('results', [])
        images  = [
            {
                'thumb':    img['urls']['small'],
                'full':     img['urls']['regular'],
                'download': img['links']['download'],
                'alt':      img.get('alt_description') or query
            }
            for img in results
        ]
        return jsonify({'images': images})

    except Exception as e:
        return jsonify({'images': [], 'error': str(e)})


# ── Start ─────────────────────────────────────────────────────
if __name__ == '__main__':
    print('\n  Backend running at http://localhost:5000')
    print('  Open index.html in your browser as usual.\n')
    app.run(debug=True, port=5000)
