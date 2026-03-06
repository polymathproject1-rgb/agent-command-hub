import type { Task } from '@/data/mockData';

const DEFAULT_AGENT_NAME = import.meta.env.VITE_AGENT_NAME || 'Rei';
const DEFAULT_AGENT_EMOJI = import.meta.env.VITE_AGENT_EMOJI || '🦐';

const toUiColumn = (column?: string): Task['column'] => {
  switch ((column || '').toLowerCase()) {
    case 'to_do':
      return 'todo';
    case 'doing':
      return 'doing';
    case 'needs_input':
      return 'needs-input';
    case 'done':
      return 'done';
    case 'canceled':
      return 'done';
    default:
      return 'todo';
  }
};

const toApiColumn = (column: Task['column']) => {
  switch (column) {
    case 'todo':
      return 'to_do';
    case 'doing':
      return 'doing';
    case 'needs-input':
      return 'needs_input';
    case 'done':
      return 'done';
    default:
      return 'to_do';
  }
};

type ApiTask = {
  id: string;
  title: string;
  priority?: string;
  column?: string;
  assignees?: { name?: string }[];
};

const mapTask = (t: ApiTask): Task => ({
  id: t.id,
  title: t.title,
  priority: (t.priority?.toLowerCase() as Task['priority']) || 'medium',
  column: toUiColumn(t.column),
  agentName: t.assignees?.[0]?.name || 'Unassigned',
  agentEmoji: '🤖',
});

async function callClawBuddy(payload: Record<string, unknown>) {
  const res = await fetch('/api/clawbuddy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      agent_name: DEFAULT_AGENT_NAME,
      agent_emoji: DEFAULT_AGENT_EMOJI,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || 'ClawBuddy API request failed');
  }

  return data;
}

export async function fetchTasks(): Promise<Task[]> {
  const json = await callClawBuddy({
    request_type: 'task',
    action: 'list',
  });

  const tasks = Array.isArray(json?.tasks) ? json.tasks : [];
  return tasks.map(mapTask);
}

export async function updateTaskColumn(taskId: string, column: Task['column']) {
  await callClawBuddy({
    request_type: 'task',
    action: 'update',
    task_id: taskId,
    column: toApiColumn(column),
  });
}
