"""
server.py - Python Backend
--------------------------
This is the backend server for the AI Chatbot.
It handles two things:
  1. /api/chat   - Takes the user's message, sends it to Groq AI, returns the reply
  2. /api/images - Takes a keyword, searches Unsplash, returns relevant photos

API keys are stored here safely and never sent to the browser.

How to run:
  python -m pip install -r requirements.txt
  python server.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)


# ---- API Keys (loaded from .env file, never hardcoded) ----

GROQ_KEY     = os.getenv('GROQ_KEY')
UNSPLASH_KEY = os.getenv('UNSPLASH_KEY')

if not GROQ_KEY or not UNSPLASH_KEY:
    raise Exception('API keys missing. Copy .env.example to .env and add your keys.')


# ---- AI Personality & Reply Style ----

SYSTEM_PROMPT = """You are a smart, friendly assistant. Follow these rules:
- Keep replies short, max 3 to 4 sentences for simple questions.
- Never write long paragraphs. Use bullet points if listing more than 2 things.
- Sound like a helpful friend, not a textbook or a robot.
- No filler phrases like Certainly, Of course, or Great question. Just answer directly.
- Use plain language. Avoid jargon unless the user uses it first."""


# ---- Route 1: Chat with AI ----

@app.route('/api/chat', methods=['POST'])
def chat():
    data    = request.json
    history = data.get('history', [])
    message = data.get('message', '').strip()

    if not message:
        return jsonify({'error': 'Message cannot be empty.'}), 400

    # Build the full conversation to send to Groq
    messages = [{'role': 'system', 'content': SYSTEM_PROMPT}] + history + [{'role': 'user', 'content': message}]

    try:
        response = requests.post(
            'https://api.groq.com/openai/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {GROQ_KEY}',
                'Content-Type' : 'application/json'
            },
            json={
                'model'      : 'llama-3.3-70b-versatile',
                'messages'   : messages,
                'max_tokens' : 300,
                'temperature': 0.7
            },
            timeout=15
        )
        response.raise_for_status()
        reply = response.json()['choices'][0]['message']['content']
        return jsonify({'reply': reply})

    except requests.exceptions.Timeout:
        return jsonify({'error': 'AI took too long to respond. Please try again.'}), 504
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ---- Route 2: Fetch Images from Unsplash ----

@app.route('/api/images', methods=['GET'])
def images():
    query = request.args.get('q', '').strip()
    count = int(request.args.get('count', 4))

    if not query:
        return jsonify({'images': []})

    try:
        response = requests.get(
            'https://api.unsplash.com/search/photos',
            headers={'Authorization': f'Client-ID {UNSPLASH_KEY}'},
            params={'query': query, 'per_page': count, 'orientation': 'squarish'},
            timeout=10
        )
        response.raise_for_status()

        results = response.json().get('results', [])
        images  = [
            {
                'thumb'   : img['urls']['small'],
                'full'    : img['urls']['regular'],
                'download': img['links']['download'],
                'alt'     : img.get('alt_description') or query
            }
            for img in results
        ]
        return jsonify({'images': images})

    except Exception as e:
        return jsonify({'images': [], 'error': str(e)})


# ---- Start the Server ----

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
