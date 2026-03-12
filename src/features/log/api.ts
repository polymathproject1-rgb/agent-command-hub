import { supabase } from '@/integrations/supabase/client';

export type AILogEntry = {
  id: string;
  agent_name: string;
  agent_emoji: string | null;
  message: string;
  category: string;
  metadata: Record<string, any>;
  created_at: string;
};

export type CreateAILogInput = {
  agent_name: string;
  agent_emoji?: string;
  message: string;
  category: string;
  metadata?: Record<string, any>;
};

export async function fetchAILogs(limit = 200): Promise<AILogEntry[]> {
  const { data, error } = await supabase
    .from('ai_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as AILogEntry[];
}

export async function createAILog(input: CreateAILogInput): Promise<AILogEntry> {
  const { data, error } = await supabase
    .from('ai_logs')
    .insert({
      agent_name: input.agent_name,
      agent_emoji: input.agent_emoji || null,
      message: input.message,
      category: input.category,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) throw error;
  return data as AILogEntry;
}
