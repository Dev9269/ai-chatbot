/**
 * api.js — Connects Frontend to Backend
 *
 * Bridge between the browser and the Python server.
 * Sends messages to the AI backend and fetches Unsplash images.
 * API keys are never stored here — they live safely in server.py.
 */

const BACKEND_URL = window.location.hostname.includes('github.io')
    ? 'https://ai-chatbot-1-401a.onrender.com'
    : '';

/**
 * Send a chat message to the AI backend and return the reply text.
 *
 * @param {Array<{role: string, content: string}>} history - Previous messages for context.
 * @param {string} message - The user's new message.
 * @returns {Promise<string>} The AI reply text.
 * @throws {Error} If the server returns an error or the request times out.
 */
export async function askAI(history, message) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    try {
        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method  : 'POST',
            headers : { 'Content-Type': 'application/json' },
            body    : JSON.stringify({ history, message }),
            signal  : controller.signal
        });

        if (response.status === 429) throw new Error('Too many requests, please wait a moment.');
        if (!response.ok) throw new Error('Server error: ' + response.status);

        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return data.reply;
    } finally {
        clearTimeout(timer);
    }
}


/**
 * Fetch relevant images from Unsplash based on a search keyword.
 *
 * @param {string} query - The search term for images.
 * @param {number} [count=4] - Number of images to fetch (max 12).
 * @returns {Promise<Array<{thumb: string, full: string, download: string, alt: string}>>}
 */
export async function fetchImages(query, count = 4) {
    if (!query) return [];

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(`${BACKEND_URL}/api/images?q=${encodeURIComponent(query)}&count=${count}`, {
            signal: controller.signal
        });
        if (!response.ok) return [];
        const data = await response.json();
        return data.images || [];
    } catch {
        return [];
    } finally {
        clearTimeout(timer);
    }
}


/**
 * Extract meaningful keywords from a user message for image search.
 *
 * Strips common words and punctuation, returns up to 3 keywords.
 *
 * @param {string} message - The user's message text.
 * @returns {string} Space-separated keywords (up to 3) or first 25 chars fallback.
 */
export function getKeyword(message) {
    const commonWords = [
        'a','an','the','is','are','was','were','be','been','have','has',
        'do','does','did','will','would','could','should','can','i','you',
        'he','she','it','we','they','me','my','your','his','her','our',
        'their','this','that','what','how','when','where','why','and',
        'but','or','for','to','of','in','on','at','by','with','about',
        'tell','show','please','like','want','need','just','very','also',
        'not','no','any','some','all'
    ];

    const keywords = message.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(' ')
        .filter(word => word.length > 2 && !commonWords.includes(word));

    return keywords.slice(0, 3).join(' ') || message.slice(0, 25);
}


/**
 * Extract direct image URLs (jpg/png/gif/webp) from AI reply text.
 *
 * @param {string} text - The AI reply content.
 * @returns {Array<{thumb: string, full: string, download: string, alt: string}>}
 */
export function extractImageUrls(text) {
    const matches = text.match(/https?:\/\/[^\s)"']+\.(?:jpg|jpeg|png|gif|webp)(?:[^\s)"']*)?/gi);
    return (matches || []).slice(0, 4).map(url => ({
        thumb: url, full: url, download: url, alt: 'image'
    }));
}
