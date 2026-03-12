import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type WebhookEvent = {
  id: string;
  webhook_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payload: Record<string, any>;
  error: string | null;
  processed_at: string | null;
  created_at: string;
  webhook_name?: string;
};

export function useWebhookEvents() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventsError) throw eventsError;

      // Get webhook names for display
      const webhookIds = [...new Set((eventsData ?? []).map((e: any) => e.webhook_id))];
      let webhookNames = new Map<string, string>();

      if (webhookIds.length > 0) {
        const { data: whData } = await supabase
          .from('webhooks')
          .select('id,name')
          .in('id', webhookIds);

        for (const wh of (whData ?? [])) {
          webhookNames.set(wh.id, wh.name);
        }
      }

      setEvents(
        ((eventsData ?? []) as WebhookEvent[]).map((e) => ({
          ...e,
          webhook_name: webhookNames.get(e.webhook_id) || 'Unknown',
        })),
      );
    } catch (err: any) {
      setError(err.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
}
