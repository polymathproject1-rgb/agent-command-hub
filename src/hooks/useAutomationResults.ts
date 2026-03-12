import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AutomationResult = {
  id: string;
  event_id: string;
  function_id: string;
  webhook_name: string;
  result_data: Record<string, any>;
  routed_to: string | null;
  routed_record_id: string | null;
  created_at: string;
};

export function useAutomationResults(webhookFilter?: string) {
  const [results, setResults] = useState<AutomationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('automation_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (webhookFilter) {
        query = query.eq('webhook_name', webhookFilter);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setResults((data ?? []) as AutomationResult[]);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  }, [webhookFilter]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return { results, loading, error, refetch: fetchResults };
}
