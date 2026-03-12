import { useState, useEffect, useCallback } from 'react';
import { fetchAILogs, createAILog, type AILogEntry, type CreateAILogInput } from '@/features/log/api';

export type { AILogEntry, CreateAILogInput };

export function useAILogs() {
  const [logs, setLogs] = useState<AILogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAILogs();
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch AI logs');
    } finally {
      setLoading(false);
    }
  }, []);

  const addLog = useCallback(async (input: CreateAILogInput) => {
    const entry = await createAILog(input);
    setLogs((prev) => [entry, ...prev]);
    return entry;
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { logs, loading, error, refetch, addLog };
}
