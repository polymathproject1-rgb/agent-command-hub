import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type IdentityCard = {
  id: string;
  agent_id: string;
  card_type: string;
  title: string;
  description: string | null;
  content_md: string;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
};

export function useAgentIdentity(agentId: string | null) {
  const [cards, setCards] = useState<IdentityCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('agent_identity_cards')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at');
      if (err) throw err;
      setCards((data ?? []) as IdentityCard[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const updateCard = useCallback(async (cardId: string, content_md: string, updated_by: string) => {
    const { error: err } = await supabase
      .from('agent_identity_cards')
      .update({ content_md, updated_by, updated_at: new Date().toISOString() })
      .eq('id', cardId);
    if (err) throw err;
    await fetchCards();
  }, [fetchCards]);

  return { cards, loading, error, refetch: fetchCards, updateCard };
}
