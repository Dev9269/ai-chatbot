/*
    api.js - Connects Frontend to Backend
    --------------------------------------
    This file is the bridge between the browser and the Python server.
    It sends the user's message to the server and gets back an AI reply and images.
    API keys are never stored here — they live safely in server.py.
*/

const BACKEND_URL = 'https://ai-chatbot-1-401a.onrender.com';


/* Send the user's message to the AI and return the reply */
export async function askAI(history, message) {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify({ history, message })
    });

    if (response.status === 429) throw new Error('Too many requests, please wait a moment.');
    if (!response.ok) throw new Error('Server error: ' + response.status);

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.reply;
}


/* Fetch relevant images from Unsplash based on a search keyword */
export async function fetchImages(query, count = 4) {
    if (!query) return [];

    const response = await fetch(`${BACKEND_URL}/api/images?q=${encodeURIComponent(query)}&count=${count}`);
    if (!response.ok) return [];

    const data = await response.json();
    return data.images || [];
}


/* Pull out the most meaningful keyword(s) from the user's message for image search */
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


/* Find any direct image URLs that the AI included in its reply */
export function extractImageUrls(text) {
    const matches = text.match(/https?:\/\/[^\s)"']+\.(?:jpg|jpeg|png|gif|webp)(?:[^\s)"']*)?/gi);
    return (matches || []).slice(0, 4).map(url => ({
        thumb: url, full: url, download: url, alt: 'image'
    }));
}
