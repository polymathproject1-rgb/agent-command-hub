import { supabase } from '@/integrations/supabase/client';
import type { Task } from '@/data/mockData';

export type DbTaskRow = {
  id: string;
  title: string;
  agent_name: string;
  agent_emoji: string;
  priority: Task['priority'];
  progress: number | null;
  column_key: Task['column'];
  created_at: string;
};

const mapRowToTask = (row: DbTaskRow): Task => ({
  id: row.id,
  title: row.title,
  agentName: row.agent_name,
  agentEmoji: row.agent_emoji,
  priority: row.priority,
  progress: row.progress ?? undefined,
  column: row.column_key,
});

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as DbTaskRow[]).map(mapRowToTask);
}

export async function updateTaskColumn(taskId: string, column: Task['column']) {
  const { error } = await supabase
    .from('tasks')
    .update({ column_key: column })
    .eq('id', taskId);

  if (error) throw error;
}
