// Supabase client setup and shared methods
// Environment variables: SUPABASE_URL, SUPABASE_ANON_KEY
const SUPABASE_URL = (typeof process !== 'undefined' && process.env && process.env.SUPABASE_URL)
  ? process.env.SUPABASE_URL
  : window.__SUPABASE_URL;
const SUPABASE_KEY = (typeof process !== 'undefined' && process.env && process.env.SUPABASE_ANON_KEY)
  ? process.env.SUPABASE_ANON_KEY
  : window.__SUPABASE_KEY;

let supabase = null;

export async function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials. Set env vars or window.__SUPABASE_* before init.');
    return null;
  }
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  return supabase;
}

export function getSupabase() {
  if (!supabase) throw new Error('Supabase not initialized. Call initSupabase() first.');
  return supabase;
}

// Session management
export async function createSession(teacherId, questionIds) {
  const { data, error } = await getSupabase()
    .from('sessions')
    .insert({
      teacher_id: teacherId,
      session_code: generateSessionCode(),
      current_question_index: 0,
      status: 'waiting',
      question_ids: questionIds,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getSession(sessionId) {
  const { data, error } = await getSupabase()
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  if (error) throw error;
  return data;
}

export async function getSessionByCode(code) {
  const { data, error } = await getSupabase()
    .from('sessions')
    .select('*')
    .eq('session_code', code)
    .single();
  if (error) throw error;
  return data;
}

export async function updateSessionQuestion(sessionId, questionIndex, status = 'active') {
  const { data, error } = await getSupabase()
    .from('sessions')
    .update({
      current_question_index: questionIndex,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function endSession(sessionId) {
  const { data, error } = await getSupabase()
    .from('sessions')
    .update({ status: 'ended', updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Participant management
export async function joinSession(sessionId, participantName) {
  const participantId = generateParticipantId();
  const { data, error } = await getSupabase()
    .from('participants')
    .insert({
      session_id: sessionId,
      participant_id: participantId,
      name: participantName,
      joined_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return { ...data, participant_id: participantId };
}

export async function getParticipants(sessionId) {
  const { data, error } = await getSupabase()
    .from('participants')
    .select('*')
    .eq('session_id', sessionId);
  if (error) throw error;
  return data || [];
}

// Response management
export async function submitResponse(sessionId, questionId, participantId, optionIndex) {
  const { data, error } = await getSupabase()
    .from('responses')
    .insert({
      session_id: sessionId,
      question_id: questionId,
      participant_id: participantId,
      option_index: optionIndex,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getResponsesForQuestion(sessionId, questionId) {
  const { data, error } = await getSupabase()
    .from('responses')
    .select('*')
    .eq('session_id', sessionId)
    .eq('question_id', questionId);
  if (error) throw error;
  return data || [];
}

export async function aggregateResponses(sessionId, questionId) {
  const responses = await getResponsesForQuestion(sessionId, questionId);
  const counts = {};
  responses.forEach((r) => {
    counts[r.option_index] = (counts[r.option_index] || 0) + 1;
  });
  return { total: responses.length, counts };
}

// Realtime subscriptions
export function subscribeToSession(sessionId, callback) {
  const sub = getSupabase()
    .channel(`session:${sessionId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` }, (payload) => {
      callback(payload);
    })
    .subscribe();
  return sub;
}

export function subscribeToResponses(sessionId, callback) {
  const sub = getSupabase()
    .channel(`responses:${sessionId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'responses', filter: `session_id=eq.${sessionId}` }, (payload) => {
      callback(payload);
    })
    .subscribe();
  return sub;
}

// Utils
function generateSessionCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateParticipantId() {
  return `p_${Math.random().toString(36).substring(2, 10)}`;
}

export default {
  initSupabase,
  getSupabase,
  createSession,
  getSession,
  getSessionByCode,
  updateSessionQuestion,
  endSession,
  joinSession,
  getParticipants,
  submitResponse,
  getResponsesForQuestion,
  aggregateResponses,
  subscribeToSession,
  subscribeToResponses,
};
