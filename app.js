// =============================================================
//  app.js  —  Frontend Logic
//
//  HOW IT WORKS:
//  User types → sendMsg() → api.js → Python server.py → Groq AI
//                                  → Python server.py → Unsplash images
//
//  SECTIONS (each feature is self-contained):
//    1. Imports & DOM
//    2. Login / Leave
//    3. Send Message
//    4. Render Messages
//    5. Image Grid & Modal
//    6. Sidebar & Theme
//    7. Save & Load Chat
// =============================================================

import { askAI, fetchImages, getKeyword, extractImageUrls } from './api.js';

// ─────────────────────────────────────────────────────────────
//  1. IMPORTS & DOM  —  all element references in one place
// ─────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);

// screens
const loginScreen = $('login-screen');
const chatScreen  = $('chat-screen');

// login
const loginForm = $('login-form');
const nameInput = $('nickname');

// chat
const msgList   = $('messages');
const msgBox    = $('msg-box');
const sendBtn   = $('send-btn');
const typingDiv = $('typing');
const charCount = $('char-count');
const userInfo  = $('user-info');

// sidebar
const sidebar = $('sidebar');
const menuBtn = $('menu-btn');

// image modal
const imgModal   = $('img-modal');
const modalImg   = $('modal-img');
const modalDl    = $('modal-dl');
const modalClose = $('modal-close');

// theme
const themeToggle = $('theme-toggle');

// app state
let myName  = '';
let history = [];  // last 40 messages sent to AI for context

// slash commands  →  add new commands here easily
const COMMANDS = {
    '/clear': () => { clearAll(); sysMsg('chat cleared'); },
    '/help':  () => sysMsg('commands: /clear, /help — just type to chat!')
};


// ─────────────────────────────────────────────────────────────
//  2. LOGIN / LEAVE
// ─────────────────────────────────────────────────────────────

// submit login form → open chat
loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    myName = name;
    openChat();
});

function openChat() {
    userInfo.innerHTML = `<span>👤 ${myName}</span>`;
    loadChat();                          // restore previous session

    loginScreen.classList.remove('active');
    chatScreen.style.display = 'flex';
    setTimeout(() => chatScreen.style.opacity = '1', 10);
    chatScreen.classList.add('active');

    if (msgList.children.length === 0) {
        botMsg(`Hey ${myName}! Ask me anything 😊`);
    }
    msgBox.focus();
}

// leave button → go back to login
$('btn-leave').onclick = leaveChat;

function leaveChat() {
    chatScreen.style.opacity = '0';
    setTimeout(() => {
        chatScreen.classList.remove('active');
        chatScreen.style.display = 'none';
        loginScreen.classList.add('active');
        loginForm.reset();
        clearAll();
        myName = '';
    }, 300);
}


// ─────────────────────────────────────────────────────────────
//  3. SEND MESSAGE
//  Flow: user types → sendMsg → askAI (api.js) → botMsg
// ─────────────────────────────────────────────────────────────

// click send button
sendBtn.addEventListener('click', sendMsg);

// press Enter to send (Shift+Enter = new line)
msgBox.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMsg();
    }
});

// auto-resize textarea + update char count while typing
msgBox.addEventListener('input', function () {
    msgBox.style.height = 'auto';
    msgBox.style.height = Math.min(msgBox.scrollHeight, 120) + 'px';

    const n = msgBox.value.length;
    charCount.textContent = `${n} / 2000`;
    charCount.style.color = n > 1800 ? 'var(--red)' : '';
});

async function sendMsg() {
    const raw = msgBox.value.trim();
    if (!raw) return;

    // check for slash commands first
    const cmd = raw.split(' ')[0].toLowerCase();
    if (COMMANDS[cmd]) {
        msgBox.value = '';
        COMMANDS[cmd]();
        return;
    }

    const text = DOMPurify.sanitize(raw).slice(0, 2000);
    msgBox.value = '';
    charCount.textContent = '0 / 2000';
    charCount.style.color = '';

    userMsg(text);
    showTyping(true);

    try {
        // step 1 — get AI reply from Python backend
        const reply = await askAI(history, text);

        // step 2 — update history (keep last 40 messages)
        history.push({ role: 'user',      content: text  });
        history.push({ role: 'assistant', content: reply });
        if (history.length > 40) history = history.slice(-40);

        // step 3 — fetch images (optional, won't break if it fails)
        let imgs = [];
        try {
            imgs = await fetchImages(getKeyword(text), 4);
        } catch (e) { /* images are optional */ }

        // step 4 — fallback: use image URLs from AI reply if no images found
        if (imgs.length === 0) imgs = extractImageUrls(reply);

        showTyping(false);
        botMsg(reply, imgs);

    } catch (err) {
        showTyping(false);
        botMsg('Something went wrong: ' + err.message);
    }

    saveChat();
}

// show/hide the "AI is thinking..." indicator
function showTyping(show) {
    typingDiv.classList.toggle('hidden', !show);
    if (show) scrollToBottom();
}


// ─────────────────────────────────────────────────────────────
//  4. RENDER MESSAGES
//  userMsg / botMsg / sysMsg all call makeRow internally
// ─────────────────────────────────────────────────────────────

function userMsg(text) {
    msgList.appendChild(makeRow('user', myName[0].toUpperCase(), text, false));
    scrollToBottom();
}

function botMsg(text, imgs = []) {
    msgList.appendChild(makeRow('bot', '🤖', text, true, imgs));
    scrollToBottom();
}

function sysMsg(text) {
    const el = document.createElement('div');
    el.className   = 'sys-msg';
    el.textContent = text;
    msgList.appendChild(el);
    scrollToBottom();
    saveChat();
}

// builds a full message row: avatar + bubble + images + timestamp
function makeRow(type, avatarText, text, useMarkdown, imgs = []) {
    const row = document.createElement('div');
    row.className = `msg-row ${type}`;

    // avatar
    const avatar = document.createElement('div');
    avatar.className   = 'av';
    avatar.textContent = avatarText;

    // message body
    const body = document.createElement('div');
    body.className = 'msg-body';

    // text bubble  (markdown for bot, plain text for user)
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = useMarkdown
        ? DOMPurify.sanitize(marked.parse(text))
        : DOMPurify.sanitize(text);

    // timestamp
    const time = document.createElement('span');
    time.className   = 'ts';
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    body.appendChild(bubble);
    if (imgs.length > 0) body.appendChild(makeImageGrid(imgs));
    body.appendChild(time);

    row.appendChild(avatar);
    row.appendChild(body);
    return row;
}

// clear all messages + history
$('btn-clear').onclick  = () => { clearAll(); sysMsg('chat cleared'); };
$('clear-btn2').onclick = () => { clearAll(); sysMsg('chat cleared'); };
$('btn-help').onclick   = () => COMMANDS['/help']();

function clearAll() {
    msgList.innerHTML = '';
    history = [];
    saveChat();
}

function scrollToBottom() {
    requestAnimationFrame(() => msgList.scrollTop = msgList.scrollHeight);
}


// ─────────────────────────────────────────────────────────────
//  5. IMAGE GRID & MODAL
//  makeImageGrid → makeImageCard → openModal / closeModal
// ─────────────────────────────────────────────────────────────

function makeImageGrid(imgs) {
    const grid = document.createElement('div');
    grid.className = 'img-grid';

    imgs.forEach(function (imgData) {
        // show skeleton placeholder while image loads
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton';
        grid.appendChild(skeleton);

        const card = makeImageCard(imgData);
        const img  = card.querySelector('img');

        img.addEventListener('load',  () => skeleton.replaceWith(card), { once: true });
        img.addEventListener('error', () => skeleton.remove(),          { once: true });
        img.src = imgData.thumb;  // set src last to trigger load/error
    });

    return grid;
}

function makeImageCard(imgData) {
    const card = document.createElement('div');
    card.className = 'img-card';

    const img = document.createElement('img');
    img.alt     = imgData.alt;
    img.loading = 'lazy';

    // hover overlay with view + download buttons
    const overlay = document.createElement('div');
    overlay.className = 'img-overlay';

    const viewBtn = document.createElement('button');
    viewBtn.textContent = '🔍 View';
    viewBtn.onclick = () => openModal(imgData.full, imgData.download, imgData.alt);

    const dlBtn = document.createElement('a');
    dlBtn.textContent = '⬇';
    dlBtn.href     = imgData.download;
    dlBtn.download = imgData.alt || 'photo';
    dlBtn.target   = '_blank';

    overlay.appendChild(viewBtn);
    overlay.appendChild(dlBtn);
    card.appendChild(img);
    card.appendChild(overlay);

    // clicking the card (not the buttons) also opens modal
    card.onclick = (e) => {
        if (e.target === viewBtn || e.target === dlBtn) return;
        openModal(imgData.full, imgData.download, imgData.alt);
    };

    return card;
}

function openModal(src, dl, alt) {
    modalImg.src     = src;
    modalImg.alt     = alt;
    modalDl.href     = dl;
    modalDl.download = alt || 'photo';
    imgModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    imgModal.classList.add('hidden');
    modalImg.src = '';
    document.body.style.overflow = '';
}

// three ways to close modal: button, backdrop click, Escape key
modalClose.onclick          = closeModal;
$('modal-bg').onclick       = closeModal;
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });


// ─────────────────────────────────────────────────────────────
//  6. SIDEBAR & THEME
// ─────────────────────────────────────────────────────────────

// apply saved theme on load
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.checked = savedTheme === 'light';

// toggle light/dark mode
themeToggle.addEventListener('change', function () {
    const t = themeToggle.checked ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
});

// hamburger menu (mobile only)
menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

// close sidebar when clicking outside on mobile
document.addEventListener('click', function (e) {
    if (window.innerWidth <= 640 && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && e.target !== menuBtn) {
            sidebar.classList.remove('open');
        }
    }
});


// ─────────────────────────────────────────────────────────────
//  7. SAVE & LOAD CHAT  (localStorage)
//  saveChat → called after every message
//  loadChat → called once when chat screen opens
// ─────────────────────────────────────────────────────────────

function saveChat() {
    const msgs = [];

    for (const el of msgList.children) {
        // system messages (e.g. "chat cleared")
        if (el.classList.contains('sys-msg')) {
            msgs.push({ type: 'sys', text: el.textContent });
            continue;
        }

        const isUser = el.classList.contains('user');
        const bubble = el.querySelector('.bubble');
        const ts     = el.querySelector('.ts')?.textContent || '';

        // save image src so they reload correctly
        const imgs = [...el.querySelectorAll('.img-card img')].map(img => ({
            thumb: img.src, full: img.src, download: img.src, alt: img.alt
        }));

        msgs.push({
            type: isUser ? 'user' : 'bot',
            html: bubble?.innerHTML || '',
            ts,
            imgs
        });
    }

    localStorage.setItem('mychat', JSON.stringify({ msgs, history }));
}

function loadChat() {
    const raw = localStorage.getItem('mychat');
    if (!raw) return;

    try {
        const data = JSON.parse(raw);
        history = data.history || [];

        for (const m of data.msgs) {
            // restore system messages
            if (m.type === 'sys') {
                const el = document.createElement('div');
                el.className   = 'sys-msg';
                el.textContent = m.text;
                msgList.appendChild(el);
                continue;
            }

            // restore user/bot messages
            const row = document.createElement('div');
            row.className = `msg-row ${m.type}`;

            const av = document.createElement('div');
            av.className   = 'av';
            av.textContent = m.type === 'user' ? myName[0].toUpperCase() : '🤖';

            const body = document.createElement('div');
            body.className = 'msg-body';

            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            bubble.innerHTML = DOMPurify.sanitize(m.html);

            const ts = document.createElement('span');
            ts.className   = 'ts';
            ts.textContent = m.ts;

            body.appendChild(bubble);
            if (m.imgs?.length > 0) body.appendChild(makeImageGrid(m.imgs));
            body.appendChild(ts);

            row.appendChild(av);
            row.appendChild(body);
            msgList.appendChild(row);
        }

        scrollToBottom();
    } catch (e) {
        console.warn('Could not load saved chat:', e);
    }
}
