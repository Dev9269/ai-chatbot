/*
    app.js - Frontend Logic
    -----------------------
    This file controls everything the user sees and does.

    How it works:
      1. User enters their name on the login screen
      2. User types a message and hits Send
      3. Message is sent to the Python backend (api.js handles this)
      4. Backend replies with an AI response + relevant images
      5. Everything is saved in the browser so chat history is kept
*/

import { askAI, fetchImages, getKeyword, extractImageUrls } from './api.js';


/* ---------- Grab all HTML elements we need ---------- */

const $ = id => document.getElementById(id);

const loginScreen = $('login-screen');
const chatScreen  = $('chat-screen');
const loginForm   = $('login-form');
const nameInput   = $('nickname');

const msgList     = $('messages');
const msgBox      = $('msg-box');
const sendBtn     = $('send-btn');
const typingDiv   = $('typing');
const charCount   = $('char-count');
const userInfo    = $('user-info');

const sidebar     = $('sidebar');
const menuBtn     = $('menu-btn');

const imgModal    = $('img-modal');
const modalImg    = $('modal-img');
const modalDl     = $('modal-dl');
const modalClose  = $('modal-close');

const themeToggle = $('theme-toggle');


/* ---------- App State ---------- */

let userName = '';
let chatHistory = [];   // stores last 40 messages to give AI context

const SLASH_COMMANDS = {
    '/clear' : () => { clearAllMessages(); showSystemMsg('Chat cleared.'); },
    '/help'  : () => showSystemMsg('Available commands: /clear, /help')
};


/* ---------- Login & Logout ---------- */

// When user submits their name, open the chat
loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    userName = name;
    openChat();
});

function openChat() {
    userInfo.innerHTML = `<span>${userName}</span>`;
    loadSavedChat();

    loginScreen.classList.remove('active');
    chatScreen.style.display = 'flex';
    setTimeout(() => chatScreen.style.opacity = '1', 10);
    chatScreen.classList.add('active');

    if (msgList.children.length === 0) {
        showBotMessage(`Hey ${userName}, ask me anything.`);
    }
    msgBox.focus();
}

// Leave button takes user back to login screen
$('btn-leave').onclick = leaveChat;

function leaveChat() {
    chatScreen.style.opacity = '0';
    setTimeout(() => {
        chatScreen.classList.remove('active');
        chatScreen.style.display = 'none';
        loginScreen.classList.add('active');
        loginForm.reset();
        clearAllMessages();
        userName = '';
    }, 300);
}


/* ---------- Sending & Receiving Messages ---------- */

// Send on button click or Enter key
sendBtn.addEventListener('click', sendMessage);

msgBox.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Auto-resize the text box and update character counter as user types
msgBox.addEventListener('input', function () {
    msgBox.style.height = 'auto';
    msgBox.style.height = Math.min(msgBox.scrollHeight, 120) + 'px';

    const length = msgBox.value.length;
    charCount.textContent = `${length} / 2000`;
    charCount.style.color = length > 1800 ? 'var(--red)' : '';
});

async function sendMessage() {
    const raw = msgBox.value.trim();
    if (!raw) return;

    // Check if user typed a slash command like /clear or /help
    const command = raw.split(' ')[0].toLowerCase();
    if (SLASH_COMMANDS[command]) {
        msgBox.value = '';
        SLASH_COMMANDS[command]();
        return;
    }

    const text = DOMPurify.sanitize(raw).slice(0, 2000);
    msgBox.value = '';
    charCount.textContent = '0 / 2000';
    charCount.style.color = '';

    showUserMessage(text);
    showTypingIndicator(true);

    try {
        // Send message to AI and wait for reply
        const reply = await askAI(chatHistory, text);

        // Save this exchange to history so AI remembers context
        chatHistory.push({ role: 'user',      content: text  });
        chatHistory.push({ role: 'assistant', content: reply });
        if (chatHistory.length > 40) chatHistory = chatHistory.slice(-40);

        // Fetch related images based on what the user asked
        let images = [];
        try {
            images = await fetchImages(getKeyword(text), 4);
        } catch (e) {}

        // If no images found from API, try to find image URLs in the AI reply
        if (images.length === 0) images = extractImageUrls(reply);

        showTypingIndicator(false);
        showBotMessage(reply, images);

    } catch (error) {
        showTypingIndicator(false);
        showBotMessage('Something went wrong: ' + error.message);
    }

    saveChat();
}

// Show or hide the "AI is thinking..." animation
function showTypingIndicator(visible) {
    typingDiv.classList.toggle('hidden', !visible);
    if (visible) scrollToBottom();
}


/* ---------- Displaying Messages ---------- */

function showUserMessage(text) {
    msgList.appendChild(buildMessageRow('user', userName[0].toUpperCase(), text, false));
    scrollToBottom();
}

function showBotMessage(text, images = []) {
    msgList.appendChild(buildMessageRow('bot', 'AI', text, true, images));
    scrollToBottom();
}

function showSystemMsg(text) {
    const el = document.createElement('div');
    el.className   = 'sys-msg';
    el.textContent = text;
    msgList.appendChild(el);
    scrollToBottom();
    saveChat();
}

// Builds a single message row with avatar, text bubble, images, and timestamp
function buildMessageRow(type, avatarLabel, text, renderMarkdown, images = []) {
    const row = document.createElement('div');
    row.className = `msg-row ${type}`;

    const avatar = document.createElement('div');
    avatar.className   = 'av';
    avatar.textContent = avatarLabel;

    const body = document.createElement('div');
    body.className = 'msg-body';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = renderMarkdown
        ? DOMPurify.sanitize(marked.parse(text))
        : DOMPurify.sanitize(text);

    const timestamp = document.createElement('span');
    timestamp.className   = 'ts';
    timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    body.appendChild(bubble);
    if (images.length > 0) body.appendChild(buildImageGrid(images));
    body.appendChild(timestamp);

    row.appendChild(avatar);
    row.appendChild(body);
    return row;
}

// Clear button (sidebar and topbar)
$('btn-clear').onclick  = () => { clearAllMessages(); showSystemMsg('Chat cleared.'); };
$('clear-btn2').onclick = () => { clearAllMessages(); showSystemMsg('Chat cleared.'); };
$('btn-help').onclick   = () => SLASH_COMMANDS['/help']();

function clearAllMessages() {
    msgList.innerHTML = '';
    chatHistory = [];
    saveChat();
}

function scrollToBottom() {
    requestAnimationFrame(() => msgList.scrollTop = msgList.scrollHeight);
}


/* ---------- Image Grid & Full-Screen Modal ---------- */

// Creates a grid of image cards below a bot message
function buildImageGrid(images) {
    const grid = document.createElement('div');
    grid.className = 'img-grid';

    images.forEach(function (imageData) {
        // Show a loading placeholder while the image downloads
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton';
        grid.appendChild(skeleton);

        const card = buildImageCard(imageData);
        const img  = card.querySelector('img');

        img.addEventListener('load',  () => skeleton.replaceWith(card), { once: true });
        img.addEventListener('error', () => skeleton.remove(),          { once: true });
        img.src = imageData.thumb;
    });

    return grid;
}

// Creates a single image card with a hover overlay (View / Download)
function buildImageCard(imageData) {
    const card = document.createElement('div');
    card.className = 'img-card';

    const img = document.createElement('img');
    img.alt     = imageData.alt;
    img.loading = 'lazy';

    const overlay = document.createElement('div');
    overlay.className = 'img-overlay';

    const viewBtn = document.createElement('button');
    viewBtn.textContent = 'View';
    viewBtn.onclick = () => openImageModal(imageData.full, imageData.download, imageData.alt);

    const downloadLink = document.createElement('a');
    downloadLink.textContent = 'Download';
    downloadLink.href     = imageData.download;
    downloadLink.download = imageData.alt || 'photo';
    downloadLink.target   = '_blank';

    overlay.appendChild(viewBtn);
    overlay.appendChild(downloadLink);
    card.appendChild(img);
    card.appendChild(overlay);

    card.onclick = (e) => {
        if (e.target === viewBtn || e.target === downloadLink) return;
        openImageModal(imageData.full, imageData.download, imageData.alt);
    };

    return card;
}

function openImageModal(src, downloadUrl, alt) {
    modalImg.src     = src;
    modalImg.alt     = alt;
    modalDl.href     = downloadUrl;
    modalDl.download = alt || 'photo';
    imgModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeImageModal() {
    imgModal.classList.add('hidden');
    modalImg.src = '';
    document.body.style.overflow = '';
}

// Three ways to close the modal: close button, click outside, or press Escape
modalClose.onclick    = closeImageModal;
$('modal-bg').onclick = closeImageModal;
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeImageModal(); });


/* ---------- Theme (Light / Dark Mode) ---------- */

const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.checked = savedTheme === 'light';

themeToggle.addEventListener('change', function () {
    const theme = themeToggle.checked ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
});


/* ---------- Sidebar (Mobile Menu) ---------- */

menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

document.addEventListener('click', function (e) {
    if (window.innerWidth <= 640 && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && e.target !== menuBtn) {
            sidebar.classList.remove('open');
        }
    }
});


/* ---------- Save & Load Chat History ---------- */

// Saves the current chat to browser storage so it survives page refresh
function saveChat() {
    const messages = [];

    for (const el of msgList.children) {
        if (el.classList.contains('sys-msg')) {
            messages.push({ type: 'sys', text: el.textContent });
            continue;
        }

        const isUser = el.classList.contains('user');
        const bubble = el.querySelector('.bubble');
        const ts     = el.querySelector('.ts')?.textContent || '';
        const imgs   = [...el.querySelectorAll('.img-card img')].map(img => ({
            thumb: img.src, full: img.src, download: img.src, alt: img.alt
        }));

        messages.push({
            type : isUser ? 'user' : 'bot',
            html : bubble?.innerHTML || '',
            ts,
            imgs
        });
    }

    localStorage.setItem('mychat', JSON.stringify({ messages, history: chatHistory }));
}

// Loads the saved chat from browser storage when user opens the app
function loadSavedChat() {
    const raw = localStorage.getItem('mychat');
    if (!raw) return;

    try {
        const data = JSON.parse(raw);
        chatHistory = data.history || [];

        for (const msg of data.messages || []) {
            if (msg.type === 'sys') {
                const el = document.createElement('div');
                el.className   = 'sys-msg';
                el.textContent = msg.text;
                msgList.appendChild(el);
                continue;
            }

            const row = document.createElement('div');
            row.className = `msg-row ${msg.type}`;

            const avatar = document.createElement('div');
            avatar.className   = 'av';
            avatar.textContent = msg.type === 'user' ? userName[0].toUpperCase() : 'AI';

            const body = document.createElement('div');
            body.className = 'msg-body';

            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            bubble.innerHTML = DOMPurify.sanitize(msg.html);

            const timestamp = document.createElement('span');
            timestamp.className   = 'ts';
            timestamp.textContent = msg.ts;

            body.appendChild(bubble);
            if (msg.imgs?.length > 0) body.appendChild(buildImageGrid(msg.imgs));
            body.appendChild(timestamp);

            row.appendChild(avatar);
            row.appendChild(body);
            msgList.appendChild(row);
        }

        scrollToBottom();
    } catch (e) {
        console.warn('Could not restore saved chat:', e);
    }
}
