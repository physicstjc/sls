// Host dashboard logic
// Loads questions from ../questions.json, manages session, shows realtime responses.

import supabaseHelper from './supabase-helper.js';

const QUESTIONS_PATH = '../questions.json';
let questions = [];
let sessionId = null;
let sessionCode = null;
let teacherId = null;
let currentQuestionIndex = 0;

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
    document.getElementById('setup-message').textContent = 'Supabase config missing. Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel project environment variables.';
    return;
  }

  try {
    await supabaseHelper.initSupabase();
    const res = await fetch(QUESTIONS_PATH);
    questions = await res.json();
  } catch (e) {
    console.error('Init error:', e);
    alert('Failed to load questions or Supabase.');
  }

  document.getElementById('create-btn').addEventListener('click', createSession);
  document.getElementById('next-q-btn').addEventListener('click', () => nextQuestion());
  document.getElementById('prev-q-btn').addEventListener('click', () => prevQuestion());
  document.getElementById('end-btn').addEventListener('click', () => endSession());
}

async function createSession() {
  teacherId = document.getElementById('teacher-id').value || 'default-teacher';

  try {
    const session = await supabaseHelper.createSession(teacherId, questions.map((q) => q.id));
    sessionId = session.id;
    sessionCode = session.session_code;

    document.getElementById('code').textContent = sessionCode;
    document.getElementById('status').textContent = 'active';
    document.getElementById('setup-panel').style.display = 'none';
    document.getElementById('quiz-panel').style.display = 'block';

    // Subscribe to session changes and responses
    subscribeToLive();

    displayQuestion(0);
    refreshParticipants();
  } catch (e) {
    console.error('Create session error:', e);
    document.getElementById('setup-message').textContent = `Error: ${e.message}`;
  }
}

async function displayQuestion(index) {
  if (index < 0 || index >= questions.length) return;
  currentQuestionIndex = index;

  const q = questions[index];
  document.getElementById('q-title').textContent = q.title;
  document.getElementById('q-text').textContent = q.question;

  // Update DB
  await supabaseHelper.updateSessionQuestion(sessionId, index, 'active');

  // Refresh chart
  refreshResponseChart(index);
}

async function refreshResponseChart(questionIndex) {
  const q = questions[questionIndex];
  const agg = await supabaseHelper.aggregateResponses(sessionId, q.id);
  const { total, counts } = agg;

  const chart = document.getElementById('response-chart');
  chart.innerHTML = '';

  if (total === 0) {
    chart.innerHTML = '<p style="color: #9fb0c8;">No responses yet.</p>';
    return;
  }

  q.options.forEach((option, index) => {
    const count = counts[index] || 0;
    const pct = ((count / total) * 100).toFixed(1);
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.innerHTML = `
      <div class="bar-label">${option}</div>
      <div class="bar-bg">
        <div class="bar-fill" style="width: ${pct}%"></div>
      </div>
      <div class="bar-stat">${count}/${total} (${pct}%)</div>
    `;
    chart.appendChild(bar);
  });
}

async function refreshParticipants() {
  if (!sessionId) return;
  const participants = await supabaseHelper.getParticipants(sessionId);
  document.getElementById('participant-count').textContent = participants.length;
  document.getElementById('count').textContent = participants.length;

  const list = document.getElementById('participants');
  list.innerHTML = '';
  participants.forEach((p) => {
    const item = document.createElement('div');
    item.className = 'participant-item';
    item.textContent = `${p.name || p.participant_id}`;
    list.appendChild(item);
  });
}

function nextQuestion() {
  displayQuestion(Math.min(questions.length - 1, currentQuestionIndex + 1));
}

function prevQuestion() {
  displayQuestion(Math.max(0, currentQuestionIndex - 1));
}

async function endSession() {
  await supabaseHelper.endSession(sessionId);
  document.getElementById('quiz-panel').style.display = 'none';
  document.getElementById('end-panel').style.display = 'block';
}

function subscribeToLive() {
  supabaseHelper.subscribeToSession(sessionId, (payload) => {
    console.log('Session update:', payload);
  });

  supabaseHelper.subscribeToResponses(sessionId, (payload) => {
    console.log('New response:', payload);
    refreshResponseChart(currentQuestionIndex);
    refreshParticipants();
  });
}

window.addEventListener('load', init);
