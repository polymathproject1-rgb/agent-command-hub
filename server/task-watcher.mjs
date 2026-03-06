import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.server' });
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const AGENT_NAME = process.env.DEFAULT_AGENT_NAME || 'Rei';

const WATCH_INTERVAL_MS = Number(process.env.TASK_WATCH_INTERVAL_MS || 60_000);
const PROGRESS_INTERVAL_MS = Number(process.env.PROGRESS_UPDATE_INTERVAL_MS || 480_000);
const STALL_INTERVAL_MS = Number(process.env.STALL_ESCALATION_INTERVAL_MS || 960_000);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[task-watcher] Missing SUPABASE_URL / SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    doing: map.get('doing'),
    needsInput: map.get('needs input'),
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
  if (error) console.error('[task-watcher] logEvent failed:', error.message);
}

async function latestMeaningfulEvent(taskId) {
  const { data, error } = await supabase
    .from('task_events')
    .select('id,event_type,created_at')
    .eq('task_id', taskId)
    .in('event_type', ['progress', 'artifact', 'complete', 'dispatch'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function tick() {
  const columns = await getColumns();

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id,title,created_at,board_column_id,task_assignees(display_name)')
    .eq('board_column_id', columns.doing);
  if (error) throw error;

  const assigned = (tasks || []).filter((t) => isAssignedTo(t, AGENT_NAME));
  const now = Date.now();

  for (const t of assigned) {
    const evt = await latestMeaningfulEvent(t.id);
    const lastMs = evt ? +new Date(evt.created_at) : +new Date(t.created_at);
    const delta = now - lastMs;

    if (delta >= STALL_INTERVAL_MS) {
      await supabase
        .from('tasks')
        .update({ board_column_id: columns.needsInput, column_key: 'needs-input' })
        .eq('id', t.id);
      await logEvent(t.id, 'escalation', 'Auto-escalated: stalled >16m without measurable progress.', {
        stallMs: delta,
      });
      continue;
    }

    if (delta >= PROGRESS_INTERVAL_MS) {
      await logEvent(t.id, 'warning', '8-minute progress update required: include % + what changed + next step.', {
        elapsedMs: delta,
      });
      console.log(`[task-watcher] progress required for ${t.title} (${t.id})`);
    }
  }

  console.log(`[task-watcher] checked ${assigned.length} active assigned task(s)`);
}

console.log(`[task-watcher] started | interval=${WATCH_INTERVAL_MS}ms`);
await tick().catch((e) => console.error('[task-watcher] initial tick failed:', e.message));
setInterval(() => tick().catch((e) => console.error('[task-watcher] tick failed:', e.message)), WATCH_INTERVAL_MS);
