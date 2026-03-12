import dotenv from 'dotenv';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.server' });
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const AGENT_NAME = process.env.DEFAULT_AGENT_NAME || 'Rei';
const LOOP_MS = Number(process.env.TASK_WORKER_INTERVAL_MS || 60_000);

// OpenClaw gateway config for dispatch bridge
const OPENCLAW_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789';
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || 'a8ee217a-6136-4d72-bf01-7710d7e085f0';
const OPENCLAW_AGENT_ID = process.env.OPENCLAW_AGENT_ID || 'main';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[task-worker] Missing SUPABASE_URL / SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = {
  activeTaskId: null,
};

// ── Task Classification ─────────────────────────────────────────────────
//
// Nova operator tasks require human/operator judgment. The worker:
//   ✓ detects them
//   ✓ dispatches a BRIEFING (not execution command) to Rei's session
//   ✓ keeps them in Needs Input (does NOT move to Doing)
//   ✓ tracks dedup / audit trail
//   ✗ does NOT auto-complete
//   ✗ does NOT upload reports
//   ✗ does NOT move to Done
//
// Non-Nova mechanical tasks follow the old flow: To Do → Doing → execute → Done.

const NOVA_PATTERNS = [
  /^\[Nova\]/i,
  /\bSend Ready\b/i,
  /\bJob Created\b/i,
  /\bDrafts Ready\b/i,
  /\bReply Received\b/i,
  /\bBLOCKED\b/i,
  /\boutbound review\b/i,
  /\breply review\b/i,
  /\boutbound blocker\b/i,
];

function isNovaTask(task) {
  const title = task?.title || '';
  return NOVA_PATTERNS.some((p) => p.test(title));
}

function executionMode(task) {
  return isNovaTask(task) ? 'session' : 'worker';
}

// ── Helpers ──────────────────────────────────────────────────────────────

function computeHash(text) {
  return crypto.createHash('md5').update(text || '').digest('hex');
}

function isAssignedTo(task, agentName) {
  const n = agentName.toLowerCase();
  return (task.task_assignees || []).some((a) => String(a.display_name || '').toLowerCase() === n);
}

async function getColumns() {
  const { data, error } = await supabase.from('board_columns').select('id,name');
  if (error) throw error;
  const map = new Map();
  for (const c of data || []) map.set(String(c.name).toLowerCase(), c.id);
  return {
    todo: map.get('to do'),
    doing: map.get('doing'),
    needsInput: map.get('needs input'),
    done: map.get('done'),
  };
}

async function logEvent(taskId, eventType, message, metadata = {}) {
  const { error } = await supabase.from('task_events').insert({
    task_id: taskId,
    event_type: eventType,
    actor: AGENT_NAME,
    message,
    metadata,
  });
  if (error) console.error('[task-worker] logEvent failed:', error.message);
}

async function fetchTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('id,title,description,created_at,created_by_bujji,board_column_id,priority,dispatch_hash,dispatched_at,handled_at,task_category,execution_mode,requires_operator_signoff,task_assignees(display_name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ── Nova Operator Dispatch ───────────────────────────────────────────────
//
// For Nova tasks: dispatches an ACTIONABLE operator turn into Rei's session.
// Rei executes the work, then sets handled_at/handled_by on the task.
// The worker does NOT complete the task or upload reports — Rei does.
// DB trigger enforces: Nova tasks cannot move to Done without handled_at.

function buildNovaDispatch(task) {
  const priorityLabel = task.priority === 'urgent' ? '🔴 URGENT' : task.priority === 'high' ? '🟠 HIGH' : task.priority || 'normal';

  return `## Nova Operator Task — Action Required

**Title:** ${task.title}
**Priority:** ${priorityLabel}
**Task ID:** ${task.id}
**Execution Mode:** operator (you execute, worker does not)

${task.description || '(no description)'}

---

### Your responsibilities for this task:

1. Execute the work described above
2. When complete, update the task on the Kanban board:
   - Set \`handled_at\` to the current timestamp
   - Set \`handled_by\` to your name
   - Move the task from Needs Input → Done
3. Upload any reports or artifacts under your own identity (not 📡)

**Important:** This task is operator-owned. The worker daemon routed it to you but will not complete it. Only you can mark it done. The database enforces this — the task cannot move to Done without \`handled_at\` being set.

Execute now.`;
}

async function dispatchNovaTask(task, columns) {
  if (!task?.description) return;

  const hash = computeHash(task.description);

  // Dedup: already dispatched with same content → skip
  if (task.dispatched_at && task.dispatch_hash === hash) return;

  const isRedispatch = !!task.dispatched_at;
  const prompt = buildNovaDispatch(task);

  // Ensure task is in Needs Input (not To Do, not Doing) + set Nova metadata
  const metaUpdate = {
    board_column_id: columns.needsInput,
    column_key: 'needs-input',
    task_category: 'nova_operator',
    execution_mode: 'operator_dispatch',
    requires_operator_signoff: true,
  };
  if (task.board_column_id !== columns.needsInput || task.task_category !== 'nova_operator') {
    await supabase
      .from('tasks')
      .update(metaUpdate)
      .eq('id', task.id);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(`${OPENCLAW_GATEWAY_URL}/v1/responses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
        'Content-Type': 'application/json',
        'x-openclaw-agent-id': OPENCLAW_AGENT_ID,
        'x-openclaw-session-key': `agent:${OPENCLAW_AGENT_ID}:main`,
      },
      body: JSON.stringify({
        model: `openclaw:${OPENCLAW_AGENT_ID}`,
        input: prompt,
        stream: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    // Read first chunk to confirm accepted, then drop the stream
    const reader = res.body?.getReader();
    let firstChunk = '';
    if (reader) {
      try {
        const { value } = await reader.read();
        firstChunk = value ? new TextDecoder().decode(value).slice(0, 200) : '';
      } catch (_) { /* ignore */ }
      reader.cancel().catch(() => {});
    }

    const idMatch = firstChunk.match(/"id"\s*:\s*"([^"]+)"/);
    const responseId = idMatch?.[1] || null;

    // Update dispatch tracking
    const now = new Date().toISOString();
    await supabase
      .from('tasks')
      .update({ dispatch_hash: hash, dispatched_at: now })
      .eq('id', task.id);

    await logEvent(task.id, 'dispatch',
      isRedispatch
        ? 'Nova operator task redispatched (description changed).'
        : 'Nova operator task dispatched to Rei session for execution.', {
        dispatch_hash: hash,
        redispatch: isRedispatch,
        response_id: responseId,
        execution_mode: 'operator_dispatch',
        dispatch_type: 'operator_task',
      });

    console.log(`[task-worker] 🚀 dispatched nova "${task.title}" → Rei session (hash=${hash.slice(0, 8)})`);
  } catch (err) {
    console.error(`[task-worker] ✗ nova dispatch failed for "${task.title}":`, err.message);
    await logEvent(task.id, 'warning', `Nova operator dispatch failed: ${err.message}`, {
      dispatch_hash: hash,
      error: err.message,
    });
  }
}

// ── Worker Execution Dispatch (non-Nova) ────────────────────────────────

function buildWorkerPrompt(task) {
  const priorityLabel = task.priority === 'urgent' ? '🔴 URGENT' : task.priority === 'high' ? '🟠 HIGH' : task.priority || 'normal';

  return `## Operator Task Dispatched

**Title:** ${task.title}
**Priority:** ${priorityLabel}
**Task ID:** ${task.id}
**Execution Mode:** worker

${task.description || '(no description)'}

---
Execute this task now. When complete, update the task on the Kanban board and report results.`;
}

async function dispatchToSession(task) {
  if (!task?.description) {
    console.log('[task-worker] skip dispatch: no description on task', task?.id);
    return;
  }

  const hash = computeHash(task.description);

  // Dedup: already dispatched with same content hash → skip
  if (task.dispatched_at && task.dispatch_hash === hash) return;

  const isRedispatch = !!task.dispatched_at;
  const prompt = buildWorkerPrompt(task);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(`${OPENCLAW_GATEWAY_URL}/v1/responses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
        'Content-Type': 'application/json',
        'x-openclaw-agent-id': OPENCLAW_AGENT_ID,
        'x-openclaw-session-key': `agent:${OPENCLAW_AGENT_ID}:main`,
      },
      body: JSON.stringify({
        model: `openclaw:${OPENCLAW_AGENT_ID}`,
        input: prompt,
        stream: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    const reader = res.body?.getReader();
    let firstChunk = '';
    if (reader) {
      try {
        const { value } = await reader.read();
        firstChunk = value ? new TextDecoder().decode(value).slice(0, 200) : '';
      } catch (_) { /* ignore */ }
      reader.cancel().catch(() => {});
    }

    const idMatch = firstChunk.match(/"id"\s*:\s*"([^"]+)"/);
    const result = { id: idMatch?.[1] || null };

    const now = new Date().toISOString();
    await supabase
      .from('tasks')
      .update({ dispatch_hash: hash, dispatched_at: now })
      .eq('id', task.id);

    await logEvent(task.id, 'dispatch', isRedispatch
      ? 'Redispatched to OpenClaw session (description changed). mode=worker'
      : 'Dispatched to OpenClaw main session. mode=worker', {
      dispatch_hash: hash,
      redispatch: isRedispatch,
      response_id: result.id || null,
      execution_mode: 'worker',
    });

    console.log(`[task-worker] ✓ dispatched "${task.title}" to OpenClaw (hash=${hash.slice(0, 8)})`);
  } catch (err) {
    console.error(`[task-worker] ✗ dispatch failed for "${task.title}":`, err.message);
    await logEvent(task.id, 'warning', `Dispatch to OpenClaw failed: ${err.message}`, {
      dispatch_hash: hash,
      error: err.message,
    });
  }
}

// ── WIP Management (non-Nova only) ──────────────────────────────────────

async function ensureSingleWip(columns, tasks) {
  // Only count non-Nova tasks toward WIP. Nova tasks live in Needs Input.
  const assignedDoing = tasks.filter(
    (t) => t.board_column_id === columns.doing && isAssignedTo(t, AGENT_NAME) && !isNovaTask(t),
  );
  assignedDoing.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

  if (assignedDoing.length <= 1) return assignedDoing[0] || null;

  const [keep, ...extras] = assignedDoing;
  for (const t of extras) {
    await supabase
      .from('tasks')
      .update({ board_column_id: columns.needsInput, column_key: 'needs-input' })
      .eq('id', t.id);
    await logEvent(t.id, 'escalation', 'Auto-escalated due to WIP limit (max 1 active Doing task).');
  }

  return keep;
}

async function dispatchNewest(columns, tasks) {
  // Only pick non-Nova tasks from To Do for auto-dispatch to Doing
  const candidates = tasks
    .filter((t) => t.board_column_id === columns.todo)
    .filter((t) => isAssignedTo(t, AGENT_NAME))
    .filter((t) => !isNovaTask(t))
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

  if (!candidates.length) return null;

  const task = candidates[0];

  const { error } = await supabase
    .from('tasks')
    .update({
      board_column_id: columns.doing,
      column_key: 'doing',
      agent_name: AGENT_NAME,
      dispatched_at: null,
      dispatch_hash: null,
    })
    .eq('id', task.id);

  if (error) throw error;

  await logEvent(task.id, 'dispatch', 'Auto-dispatched from To Do to Doing by worker.', {
    reason: 'assigned_to_rei_newest_first',
  });

  return { ...task, board_column_id: columns.doing, dispatched_at: null, dispatch_hash: null };
}

async function ensureAdopted(task) {
  const { data, error } = await supabase
    .from('task_events')
    .select('id')
    .eq('task_id', task.id)
    .eq('event_type', 'dispatch')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    await logEvent(task.id, 'dispatch', 'Worker adopted existing assigned task into active execution loop.', {
      adopted: true,
    });
  }
}

// ── Nova Scanner ────────────────────────────────────────────────────────
//
// Scans for Nova tasks in To Do or Needs Input that haven't been briefed yet
// (or whose description changed). Dispatches briefing, parks in Needs Input.

async function scanNovaTasks(columns, tasks) {
  const novaTasks = tasks.filter(
    (t) =>
      isNovaTask(t) &&
      isAssignedTo(t, AGENT_NAME) &&
      (t.board_column_id === columns.todo || t.board_column_id === columns.needsInput),
  );

  for (const task of novaTasks) {
    await dispatchNovaTask(task, columns);
  }

  return novaTasks.length;
}

// ── Main Loop ───────────────────────────────────────────────────────────

async function tick() {
  const columns = await getColumns();
  const tasks = await fetchTasks();

  // 1. Handle Nova tasks: briefing dispatch only, keep in Needs Input
  const novaCount = await scanNovaTasks(columns, tasks);

  // 2. Handle non-Nova tasks: WIP + auto-dispatch to Doing + execution
  let active = await ensureSingleWip(columns, tasks);

  if (!active) {
    active = await dispatchNewest(columns, tasks);
  }

  state.activeTaskId = active?.id || null;

  const ts = new Date().toISOString();
  if (active) {
    await ensureAdopted(active);
    await dispatchToSession(active);
    console.log(`[${ts}] active=${active.title} (${active.id}) mode=worker`);
  } else if (novaCount > 0) {
    console.log(`[${ts}] no active worker task | ${novaCount} nova task(s) dispatched to operator`);
  } else {
    console.log(`[${ts}] no active assigned task`);
  }
}

console.log(`[task-worker] started | interval=${LOOP_MS}ms | gateway=${OPENCLAW_GATEWAY_URL}`);
await tick().catch((e) => console.error('[task-worker] initial tick failed:', e.message));
setInterval(() => tick().catch((e) => console.error('[task-worker] tick failed:', e.message)), LOOP_MS);
