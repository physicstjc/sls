// Student join and answer logic
import supabaseHelper from './supabase-helper.js';

const QUESTIONS_PATH = '../questions.json';
let questions = [];
let sessionId = null;
let participantId = null;
let currentQuestionIndex = 0;
let selectedOptionIndex = null;

async function loadSupabaseRuntimeConfig() {
  const storedUrl = sessionStorage.getItem('sb_url');
  const storedKey = sessionStorage.getItem('sb_key');
  if (storedUrl && storedKey) {
    window.__SUPABASE_URL = storedUrl;
    window.__SUPABASE_KEY = storedKey;
    return true;
  }

  try {
    const res = await fetch('/api/config', { cache: 'no-store' });
    if (!res.ok) return false;
    const cfg = await res.json();
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return false;

    window.__SUPABASE_URL = cfg.supabaseUrl;
    window.__SUPABASE_KEY = cfg.supabaseAnonKey;
    sessionStorage.setItem('sb_url', cfg.supabaseUrl);
    sessionStorage.setItem('sb_key', cfg.supabaseAnonKey);
    return true;
  } catch (e) {
    return false;
  }
}

async function init() {
  const hasConfig = await loadSupabaseRuntimeConfig();
  if (!hasConfig) {
    document.getElementById('join-message').textContent = 'Supabase config missing. Ask teacher to set Vercel env vars SUPABASE_URL and SUPABASE_ANON_KEY.';
    return;
  }

  try {
    await supabaseHelper.initSupabase();
    const res = await fetch(QUESTIONS_PATH);
    questions = await res.json();
  } catch (e) {
    console.error('Init error:', e);
    alert('Failed to load.');
  }

  document.getElementById('join-btn').addEventListener('click', joinSession);
}

async function joinSession() {
  const code = document.getElementById('session-code').value.toUpperCase();
  const name = document.getElementById('student-name').value;

  if (!code || !name) {
    document.getElementById('join-message').textContent = 'Code and name required.';
    return;
  }

  try {
    const session = await supabaseHelper.getSessionByCode(code);
    sessionId = session.id;

    const participant = await supabaseHelper.joinSession(sessionId, name);
    participantId = participant.participant_id;

    document.getElementById('join-panel').style.display = 'none';
    document.getElementById('quiz-panel').style.display = 'block';

    subscribeToQuestionChanges();
    displayQuestion(session.current_question_index);
  } catch (e) {
    console.error('Join error:', e);
    document.getElementById('join-message').textContent = `Error: ${e.message}`;
  }
}

function displayQuestion(index) {
  currentQuestionIndex = index;
  if (index < 0 || index >= questions.length) {
    document.getElementById('quiz-panel').style.display = 'none';
    document.getElementById('waiting-panel').style.display = 'block';
    return;
  }

  const q = questions[index];
  document.getElementById('q-title').textContent = q.title;
  document.getElementById('q-text').textContent = q.question;
  document.getElementById('feedback').textContent = '';
  selectedOptionIndex = null;

  const optionsDiv = document.getElementById('options');
  optionsDiv.innerHTML = '';

  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => selectOption(i));
    optionsDiv.appendChild(btn);
  });
}

function selectOption(index) {
  selectedOptionIndex = index;
  const buttons = document.querySelectorAll('.option-btn');
  buttons.forEach((btn, i) => {
    btn.classList.toggle('selected', i === index);
  });
  document.getElementById('submit-btn').disabled = false;
}

async function submitAnswer() {
  if (selectedOptionIndex === null) return;

  const q = questions[currentQuestionIndex];
  try {
    await supabaseHelper.submitResponse(sessionId, q.id, participantId, selectedOptionIndex);
    document.getElementById('feedback').textContent = 'Answer submitted! Waiting for next question...';
    document.getElementById('submit-btn').disabled = true;
    selectedOptionIndex = null;
  } catch (e) {
    console.error('Submit error:', e);
    document.getElementById('feedback').textContent = `Error: ${e.message}`;
  }
}

function subscribeToQuestionChanges() {
  supabaseHelper.subscribeToSession(sessionId, (payload) => {
    if (payload.new && payload.new.current_question_index !== undefined) {
      displayQuestion(payload.new.current_question_index);
    }
  });
}

document.getElementById('submit-btn').addEventListener('click', submitAnswer);
window.addEventListener('load', init);
