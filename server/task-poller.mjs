import dotenv from 'dotenv';

dotenv.config({ path: '.env.server' });
dotenv.config();

const API_URL = process.env.CLAWBUDDY_API_URL;
const WEBHOOK_SECRET = process.env.CLAWBUDDY_WEBHOOK_SECRET;
const AGENT_NAME = process.env.DEFAULT_AGENT_NAME || 'Rei';
const AGENT_EMOJI = process.env.DEFAULT_AGENT_EMOJI || '🦐';
const INTERVAL_MS = Number(process.env.TASK_POLL_INTERVAL_MS || 60_000);

if (!API_URL || !WEBHOOK_SECRET) {
  console.error('[task-poller] Missing CLAWBUDDY_API_URL or CLAWBUDDY_WEBHOOK_SECRET');
  process.exit(1);
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

async function pollOnce() {
  const [todo, needsInput] = await Promise.all([
    call({ request_type: 'task', action: 'list', column: 'to_do' }),
    call({ request_type: 'task', action: 'list', column: 'needs_input' }),
  ]);

  const todoCount = Array.isArray(todo?.tasks) ? todo.tasks.length : 0;
  const needsInputCount = Array.isArray(needsInput?.tasks) ? needsInput.tasks.length : 0;

  const ts = new Date().toISOString();
  if (todoCount || needsInputCount) {
    console.log(`[${ts}] actionable tasks found | to_do=${todoCount} needs_input=${needsInputCount}`);
  } else {
    console.log(`[${ts}] no actionable tasks`);
  }
}

console.log(`[task-poller] started | interval=${INTERVAL_MS}ms`);
await pollOnce().catch((err) => console.error('[task-poller] initial poll failed:', err.message));
setInterval(() => {
  pollOnce().catch((err) => console.error('[task-poller] poll failed:', err.message));
}, INTERVAL_MS);
