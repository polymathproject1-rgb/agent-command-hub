import dotenv from 'dotenv';
import { exec } from 'node:child_process';

dotenv.config({ path: '.env.server' });
dotenv.config();

const API_URL = process.env.CLAWBUDDY_API_URL;
const WEBHOOK_SECRET = process.env.CLAWBUDDY_WEBHOOK_SECRET;
const AGENT_NAME = process.env.DEFAULT_AGENT_NAME || 'Rei';
const AGENT_EMOJI = process.env.DEFAULT_AGENT_EMOJI || '🦐';
const INTERVAL_MS = Number(process.env.TASK_POLL_INTERVAL_MS || 60_000);
const ENABLE_DESKTOP_NOTIFICATIONS = process.env.ENABLE_DESKTOP_NOTIFICATIONS === 'true';

if (!API_URL || !WEBHOOK_SECRET) {
  console.error('[task-poller] Missing CLAWBUDDY_API_URL or CLAWBUDDY_WEBHOOK_SECRET');
  process.exit(1);
}

const seenTaskIds = new Set();

function desktopNotify(title, message) {
  if (!ENABLE_DESKTOP_NOTIFICATIONS) return;
  const safeTitle = title.replace(/"/g, '\\"');
  const safeMsg = message.replace(/"/g, '\\"');
  exec(`osascript -e 'display notification "${safeMsg}" with title "${safeTitle}"'`);
}

async function call(payload) {
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

function extractTasks(response) {
  return Array.isArray(response?.tasks) ? response.tasks : [];
}

function taskId(task) {
  return task?.id || task?.task_id || null;
}

async function pollOnce() {
  const [todo, needsInput] = await Promise.all([
    call({ request_type: 'task', action: 'list', column: 'to_do' }),
    call({ request_type: 'task', action: 'list', column: 'needs_input' }),
  ]);

  const todoTasks = extractTasks(todo);
  const needsInputTasks = extractTasks(needsInput);
  const all = [...todoTasks, ...needsInputTasks];

  const newTasks = [];
  for (const t of all) {
    const id = taskId(t);
    if (!id) continue;
    if (!seenTaskIds.has(id)) {
      seenTaskIds.add(id);
      newTasks.push(t);
    }
  }

  const ts = new Date().toISOString();
  if (newTasks.length) {
    const preview = newTasks
      .slice(0, 3)
      .map((t) => t.title || '(untitled task)')
      .join(' | ');
    console.log(`[${ts}] 🚨 NEW TASKS: +${newTasks.length} | ${preview}`);
    desktopNotify('ClawBuddy: New Task', `${newTasks.length} new task(s) detected`);
  } else {
    console.log(`[${ts}] no new tasks | to_do=${todoTasks.length} needs_input=${needsInputTasks.length}`);
  }
}

console.log(`[task-poller] started | interval=${INTERVAL_MS}ms | desktop_notify=${ENABLE_DESKTOP_NOTIFICATIONS}`);
await pollOnce().catch((err) => console.error('[task-poller] initial poll failed:', err.message));
setInterval(() => {
  pollOnce().catch((err) => console.error('[task-poller] poll failed:', err.message));
}, INTERVAL_MS);
