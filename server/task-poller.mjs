import dotenv from 'dotenv';
import { exec } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.server' });
dotenv.config();

const API_URL = process.env.AGENT_COMMAND_API_URL;         
const WEBHOOK_SECRET = process.env.AGENT_COMMAND_WEBHOOK_SECRET;
const AGENT_NAME = process.env.DEFAULT_AGENT_NAME || 'Rei';
const AGENT_EMOJI = process.env.DEFAULT_AGENT_EMOJI || '🦐';
const INTERVAL_MS = Number(process.env.TASK_POLL_INTERVAL_MS || 60_000);
const PROGRESS_UPDATE_INTERVAL_MS = Number(process.env.PROGRESS_UPDATE_INTERVAL_MS || 480_000); // 8 min default
const ENABLE_DESKTOP_NOTIFICATIONS = process.env.ENABLE_DESKTOP_NOTIFICATIONS === 'true';
const POLL_SOURCE = process.env.TASK_POLL_SOURCE || 'supabase'; // supabase | api

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const useSupabase = POLL_SOURCE === 'supabase' && !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
const supabase = useSupabase ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

if (!useSupabase && (!API_URL || !WEBHOOK_SECRET)) {
  console.error('[task-poller] Missing AGENT_COMMAND_API_URL or AGENT_COMMAND_WEBHOOK_SECRET in env');
  process.exit(1);
}

const seenTaskIds = new Set();
const lastProgressPingByTask = new Map();

function desktopNotify(title, message) {
  if (!ENABLE_DESKTOP_NOTIFICATIONS) return;
  const safeTitle = title.replace(/"/g, '\\"');
  const safeMsg = message.replace(/"/g, '\\"');
  exec(`osascript -e 'display notification "${safeMsg}" with title "${safeTitle}"'`);
}

async function callAgentAPI(payload) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': WEBHOOK_SECRET,
    },
    body: JSON.stringify({
      ...payload,
      agent_name: AGENT_NAME,
      agent_emoji: AGENT_EMOJI,
    }),
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(json)}`);
  }

  return json;
}

async function fetchSupabaseTasks() {
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id,title,created_at,task_assignees(display_name),board_columns(name)')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (tasks || []).map((t) => ({
    id: t.id,
    title: t.title,
    created_at: t.created_at,
    assignees: (t.task_assignees || []).map((a) => ({ name: a.display_name })),
    column: { name: t.board_columns?.name || null },
  }));
}

function isAssignedToRei(task) {
  return Array.isArray(task.assignees) && task.assignees.some((a) => String(a.name || '').toLowerCase().includes('rei'));
}

function isDoing(task) {
  return String(task?.column?.name || '').toLowerCase() === 'doing';
}

function maybeEmitProgressPings(tasks) {
  const now = Date.now();
  const active = tasks.filter((t) => isAssignedToRei(t) && isDoing(t));

  for (const t of active) {
    const last = lastProgressPingByTask.get(t.id) || 0;
    if (now - last >= PROGRESS_UPDATE_INTERVAL_MS) {
      const ts = new Date().toISOString();
      console.log(`[${ts}] 📈 8-MIN PROGRESS UPDATE REQUIRED | task=${t.title} (${t.id})`);
      desktopNotify('Progress Update Due', `${t.title}`);
      lastProgressPingByTask.set(t.id, now);
    }
  }

  // cleanup finished tasks from tracking map
  const activeIds = new Set(active.map((t) => t.id));
  for (const id of lastProgressPingByTask.keys()) {
    if (!activeIds.has(id)) lastProgressPingByTask.delete(id);
  }
}

async function pollOnce() {
  let all = [];

  if (useSupabase) {
    all = await fetchSupabaseTasks();
  } else {
    const [todo, needsInput] = await Promise.all([
      callAgentAPI({ request_type: 'task', action: 'list', column: 'to_do' }),
      callAgentAPI({ request_type: 'task', action: 'list', column: 'needs_input' }),
    ]);
    all = [...(Array.isArray(todo?.tasks) ? todo.tasks : []), ...(Array.isArray(needsInput?.tasks) ? needsInput.tasks : [])];
  }

  const newTasks = [];
  for (const t of all) {
    const id = t?.id || t?.task_id;
    if (!id) continue;
    if (!seenTaskIds.has(id)) {
      seenTaskIds.add(id);
      newTasks.push(t);
    }
  }

  const assignedToRei = all.filter((t) => isAssignedToRei(t));

  const ts = new Date().toISOString();
  if (newTasks.length) {
    const preview = newTasks
      .slice(0, 3)
      .map((t) => t.title || '(untitled task)')
      .join(' | ');
    console.log(`[${ts}] 🚨 NEW TASKS: +${newTasks.length} | ${preview}`);
    desktopNotify('Agent Command Hub: New Task', `${newTasks.length} new task(s) detected`);
  } else {
    console.log(`[${ts}] no new tasks | total=${all.length}`);
  }

  if (assignedToRei.length) {
    const top = assignedToRei[0];
    console.log(`[${ts}] 🎯 ASSIGNED TO REI: ${top.title} (${top.id})`);
  }

  maybeEmitProgressPings(all);
}

console.log(
  `[task-poller] started | source=${useSupabase ? 'supabase' : 'api'} | poll=${INTERVAL_MS}ms | progress=${PROGRESS_UPDATE_INTERVAL_MS}ms | desktop_notify=${ENABLE_DESKTOP_NOTIFICATIONS}`,
);
await pollOnce().catch((err) => console.error('[task-poller] initial poll failed:', err.message));
setInterval(() => {
  pollOnce().catch((err) => console.error('[task-poller] poll failed:', err.message));
}, INTERVAL_MS);
