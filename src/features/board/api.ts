import { supabase } from '@/integrations/supabase/client';

export type BoardColumn = {
  id: string;
  name: string;
  color: string | null;
  position: number;
};

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  board_column_id: string;
  priority: string | null;
  due_date: string | null;
  position: number | null;
  created_at: string;
  created_by_bujji: boolean | null;
};

export type SubtaskRow = {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
};

export type TaskAssigneeRow = {
  id: string;
  task_id: string;
  user_id: string | null;
  display_name: string;
};

export type BoardTask = TaskRow & {
  subtasks: SubtaskRow[];
  assignees: TaskAssigneeRow[];
};

export async function fetchBoardColumns(): Promise<BoardColumn[]> {
  const { data, error } = await supabase
    .from('board_columns')
    .select('id,name,color,position')
    .order('position', { ascending: true });

  if (error) throw error;
  return (data as BoardColumn[]) ?? [];
}

export async function fetchBoardTasks(): Promise<BoardTask[]> {
  const { data: tasksData, error: tasksError } = await supabase
    .from('tasks')
    .select('id,title,description,board_column_id,priority,due_date,position,created_at,created_by_bujji')
    .order('position', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (tasksError) throw tasksError;

  const tasks = (tasksData as TaskRow[]) ?? [];
  if (!tasks.length) return [];

  const ids = tasks.map((t) => t.id);

  const [{ data: subtasksData, error: subtasksError }, { data: assigneesData, error: assigneesError }] =
    await Promise.all([
      supabase.from('subtasks').select('id,task_id,title,completed').in('task_id', ids),
      supabase.from('task_assignees').select('id,task_id,user_id,display_name').in('task_id', ids),
    ]);

  if (subtasksError) throw subtasksError;
  if (assigneesError) throw assigneesError;

  const subtasksByTask = new Map<string, SubtaskRow[]>();
  for (const st of ((subtasksData as SubtaskRow[]) ?? [])) {
    const arr = subtasksByTask.get(st.task_id) ?? [];
    arr.push(st);
    subtasksByTask.set(st.task_id, arr);
  }

  const assigneesByTask = new Map<string, TaskAssigneeRow[]>();
  for (const a of ((assigneesData as TaskAssigneeRow[]) ?? [])) {
    const arr = assigneesByTask.get(a.task_id) ?? [];
    arr.push(a);
    assigneesByTask.set(a.task_id, arr);
  }

  return tasks.map((t) => ({
    ...t,
    subtasks: subtasksByTask.get(t.id) ?? [],
    assignees: assigneesByTask.get(t.id) ?? [],
  }));
}

const normalizePriority = (value?: string | null) => {
  const v = (value || 'medium').toLowerCase();
  if (v === 'urgent' || v === 'high' || v === 'medium' || v === 'low') return v;
  return 'medium';
};

const toLegacyColumnKey = (columnName?: string | null) => {
  const key = (columnName || '').toLowerCase();
  if (key === 'to do') return 'todo';
  if (key === 'doing') return 'doing';
  if (key === 'needs input') return 'needs-input';
  if (key === 'done') return 'done';
  if (key === 'canceled') return 'done';
  return 'todo';
};

export async function createTask(input: {
  title: string;
  description?: string;
  priority: string;
  board_column_id: string;
  due_date?: string | null;
  assignees?: string[];
}) {
  const { data: columnRow } = await supabase
    .from('board_columns')
    .select('name')
    .eq('id', input.board_column_id)
    .maybeSingle();

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: input.title,
      description: input.description || null,
      priority: normalizePriority(input.priority),
      board_column_id: input.board_column_id,
      column_key: toLegacyColumnKey(columnRow?.name),
      agent_name: 'Rei',
      agent_emoji: '🦐',
      due_date: input.due_date || null,
      created_by_bujji: false,
    })
    .select('id')
    .single();

  if (error) throw error;

  const task = data as { id: string };

  const assignees = Array.from(new Set((input.assignees || []).map((a) => a.trim()).filter(Boolean)));
  if (assignees.length) {
    const { error: assigneeError } = await supabase.from('task_assignees').insert(
      assignees.map((display_name) => ({ task_id: task.id, display_name })),
    );
    if (assigneeError) throw assigneeError;
  }

  return task;
}

export async function updateTask(taskId: string, patch: Partial<TaskRow>) {
  const payload: Partial<TaskRow> & { column_key?: string } = { ...patch };
  if (typeof payload.priority === 'string') {
    payload.priority = normalizePriority(payload.priority);
  }

  if (payload.board_column_id) {
    const { data: columnRow } = await supabase
      .from('board_columns')
      .select('name')
      .eq('id', payload.board_column_id)
      .maybeSingle();
    payload.column_key = toLegacyColumnKey(columnRow?.name);
  }

  const { error } = await supabase.from('tasks').update(payload).eq('id', taskId);
  if (error) throw error;
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw error;
}

export async function addSubtask(taskId: string, title: string) {
  const { error } = await supabase.from('subtasks').insert({ task_id: taskId, title, completed: false });
  if (error) throw error;
}

export async function updateSubtask(subtaskId: string, patch: Partial<SubtaskRow>) {
  const { error } = await supabase.from('subtasks').update(patch).eq('id', subtaskId);
  if (error) throw error;
}

export async function deleteSubtask(subtaskId: string) {
  const { error } = await supabase.from('subtasks').delete().eq('id', subtaskId);
  if (error) throw error;
}

export async function addAssignee(taskId: string, displayName: string) {
  const { error } = await supabase.from('task_assignees').insert({ task_id: taskId, display_name: displayName });
  if (error) throw error;
}

export async function removeAssignee(assigneeId: string) {
  const { error } = await supabase.from('task_assignees').delete().eq('id', assigneeId);
  if (error) throw error;
}
