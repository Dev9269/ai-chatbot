// =============================================================
//  api.js  —  All server communication
//  Frontend calls Python backend at localhost:5000
//  API keys are safe in server.py, never exposed here
// =============================================================

const BASE_URL = 'http://localhost:5000';


// ── Send message to AI and get a reply ────────────────────────
export async function askAI(history, message) {
    const res = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, message })
    });

    if (res.status === 429) throw new Error('too many requests, wait a bit');
    if (!res.ok)            throw new Error('server error: ' + res.status);

    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.reply;
}


// ── Fetch images from Unsplash via backend ────────────────────
export async function fetchImages(query, count = 4) {
    if (!query) return [];

    const res = await fetch(`${BASE_URL}/api/images?q=${encodeURIComponent(query)}&count=${count}`);
    if (!res.ok) return [];

    const data = await res.json();
    return data.images || [];
}


// ── Extract the best keyword(s) from a user message ──────────
export function getKeyword(msg) {
    const stopwords = [
        'a','an','the','is','are','was','were','be','been','have','has',
        'do','does','did','will','would','could','should','can','i','you',
        'he','she','it','we','they','me','my','your','his','her','our',
        'their','this','that','what','how','when','where','why','and',
        'but','or','for','to','of','in','on','at','by','with','about',
        'tell','show','please','like','want','need','just','very','also',
        'not','no','any','some','all'
    ];

    const words = msg.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(' ')
        .filter(w => w.length > 2 && !stopwords.includes(w));

    return words.slice(0, 3).join(' ') || msg.slice(0, 25);
}


// ── Extract image URLs the AI may have included in its reply ──
export function extractImageUrls(text) {
    const matches = text.match(/https?:\/\/[^\s)"']+\.(?:jpg|jpeg|png|gif|webp)(?:[^\s)"']*)?/gi);
    return (matches || []).slice(0, 4).map(url => ({
        thumb: url, full: url, download: url, alt: 'image'
    }));
}
