import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type DailyLog = {
  id: string;
  agent_id: string;
  log_date: string;
  title: string;
  content_md: string;
  written_by: string | null;
  created_at: string;
  updated_at: string;
};

export function useAgentDailyLogs(agentId: string | null) {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('agent_daily_logs')
        .select('*')
        .eq('agent_id', agentId)
        .order('log_date', { ascending: false })
        .limit(100);
      if (err) throw err;
      setLogs((data ?? []) as DailyLog[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const createLog = useCallback(async (log_date: string, title: string, content_md: string, written_by: string) => {
    if (!agentId) throw new Error('No agent selected');
    const { error: err } = await supabase
      .from('agent_daily_logs')
      .insert({ agent_id: agentId, log_date, title, content_md, written_by });
    if (err) throw err;
    await fetchLogs();
  }, [agentId, fetchLogs]);

  const updateLog = useCallback(async (logId: string, content_md: string, title?: string) => {
    const updates: Record<string, any> = { content_md, updated_at: new Date().toISOString() };
    if (title) updates.title = title;
    const { error: err } = await supabase
      .from('agent_daily_logs')
      .update(updates)
      .eq('id', logId);
    if (err) throw err;
    await fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, error, refetch: fetchLogs, createLog, updateLog };
}
