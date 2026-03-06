import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.server' });
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const AGENT_NAME = process.env.DEFAULT_AGENT_NAME || 'Rei';
const LOOP_MS = Number(process.env.TASK_WORKER_INTERVAL_MS || 60_000);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[task-worker] Missing SUPABASE_URL / SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = {
  activeTaskId: null,
};

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
    .select('id,title,description,created_at,created_by_bujji,board_column_id,priority,task_assignees(display_name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function ensureSingleWip(columns, tasks) {
  const assignedDoing = tasks.filter(
    (t) => t.board_column_id === columns.doing && isAssignedTo(t, AGENT_NAME),
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
  const candidates = tasks
    .filter((t) => t.board_column_id === columns.todo)
    .filter((t) => isAssignedTo(t, AGENT_NAME))
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

  if (!candidates.length) return null;

  const task = candidates[0];
  const { error } = await supabase
    .from('tasks')
    .update({ board_column_id: columns.doing, column_key: 'doing', agent_name: AGENT_NAME })
    .eq('id', task.id);

  if (error) throw error;

  await logEvent(task.id, 'dispatch', 'Auto-dispatched from To Do to Doing by worker.', {
    reason: 'assigned_to_rei_newest_first',
  });

  return { ...task, board_column_id: columns.doing };
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

async function tick() {
  const columns = await getColumns();
  const tasks = await fetchTasks();

  let active = await ensureSingleWip(columns, tasks);

  if (!active) {
    active = await dispatchNewest(columns, tasks);
  }

  state.activeTaskId = active?.id || null;

  const ts = new Date().toISOString();
  if (active) {
    await ensureAdopted(active);
    console.log(`[${ts}] active=${active.title} (${active.id})`);
  } else {
    console.log(`[${ts}] no active assigned task`);
  }
}

console.log(`[task-worker] started | interval=${LOOP_MS}ms`);
await tick().catch((e) => console.error('[task-worker] initial tick failed:', e.message));
setInterval(() => tick().catch((e) => console.error('[task-worker] tick failed:', e.message)), LOOP_MS);
