import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Webhook = {
  id: string;
  name: string;
  slug: string;
  secret: string | null;
  is_active: boolean;
  created_at: string;
};

export type WebhookFunction = {
  id: string;
  webhook_id: string;
  name: string;
  prompt: string;
  output_table: string | null;
  is_active: boolean;
  created_at: string;
};

export type WebhookWithFunctions = Webhook & {
  functions: WebhookFunction[];
};

export function useWebhooks() {
  const [webhooks, setWebhooks] = useState<WebhookWithFunctions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: whData, error: whError }, { data: fnData, error: fnError }] =
        await Promise.all([
          supabase.from('webhooks').select('*').order('created_at', { ascending: false }),
          supabase.from('webhook_functions').select('*').order('created_at', { ascending: true }),
        ]);

      if (whError) throw whError;
      if (fnError) throw fnError;

      const webhookList = (whData ?? []) as Webhook[];
      const functionList = (fnData ?? []) as WebhookFunction[];

      const fnByWebhook = new Map<string, WebhookFunction[]>();
      for (const fn of functionList) {
        const arr = fnByWebhook.get(fn.webhook_id) ?? [];
        arr.push(fn);
        fnByWebhook.set(fn.webhook_id, arr);
      }

      setWebhooks(
        webhookList.map((wh) => ({
          ...wh,
          functions: fnByWebhook.get(wh.id) ?? [],
        })),
      );
    } catch (err: any) {
      setError(err.message || 'Failed to fetch webhooks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const createWebhook = async (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const secret = crypto.randomUUID();

    const { error } = await supabase
      .from('webhooks')
      .insert({ name, slug, secret });

    if (error) throw error;
    await fetchWebhooks();
  };

  const deleteWebhook = async (id: string) => {
    const { error } = await supabase.from('webhooks').delete().eq('id', id);
    if (error) throw error;
    await fetchWebhooks();
  };

  const toggleWebhook = async (id: string, is_active: boolean) => {
    const { error } = await supabase.from('webhooks').update({ is_active }).eq('id', id);
    if (error) throw error;
    await fetchWebhooks();
  };

  const createFunction = async (input: {
    webhook_id: string;
    name: string;
    prompt: string;
    output_table?: string | null;
  }) => {
    const { error } = await supabase.from('webhook_functions').insert({
      webhook_id: input.webhook_id,
      name: input.name,
      prompt: input.prompt,
      output_table: input.output_table || null,
    });
    if (error) throw error;
    await fetchWebhooks();
  };

  const deleteFunction = async (id: string) => {
    const { error } = await supabase.from('webhook_functions').delete().eq('id', id);
    if (error) throw error;
    await fetchWebhooks();
  };

  return {
    webhooks,
    loading,
    error,
    refetch: fetchWebhooks,
    createWebhook,
    deleteWebhook,
    toggleWebhook,
    createFunction,
    deleteFunction,
  };
}
