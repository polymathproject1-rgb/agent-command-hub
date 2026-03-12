import { supabase } from '@/integrations/supabase/client';

// ── Types ──────────────────────────────────────────────────

export type LexaCall = {
  id: string;
  call_id: string | null;
  session_id: string | null;
  from_phone: string | null;
  to_phone: string | null;
  direction: 'outbound' | 'inbound';
  status: 'initiated' | 'in-progress' | 'completed' | 'user-ended' | 'api-ended' | 'error' | 'timeout';
  duration_seconds: number | null;
  cost: number | null;
  transcript: Array<{ role: string; content: string; timestamp?: number | null }>;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  recording_url: string | null;
  agent_name: string | null;
  campaign_id: string | null;
  lead_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
};

export type LexaLead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'dnc';
  tags: string[];
  notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type LexaCampaign = {
  id: string;
  name: string;
  description: string | null;
  agent_prompt: string | null;
  status: 'draft' | 'running' | 'paused' | 'completed';
  from_phone: string | null;
  total_leads: number;
  completed_leads: number;
  config: {
    max_concurrent: number;
    delay_between_calls: number;
    retry_failed: boolean;
  };
  created_at: string;
  updated_at: string;
};

export type LexaDailyMetric = {
  id: string;
  date: string;
  total_calls: number;
  avg_duration: number;
  total_cost: number;
  answer_rate: number;
  sentiment_breakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  created_at: string;
};

// ── Calls ──────────────────────────────────────────────────

export async function fetchCalls(filters?: {
  status?: string;
  agent_name?: string;
  campaign_id?: string;
  limit?: number;
}): Promise<LexaCall[]> {
  const query = supabase
    .from('lexa_calls')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) query.eq('status', filters.status);
  if (filters?.agent_name) query.eq('agent_name', filters.agent_name);
  if (filters?.campaign_id) query.eq('campaign_id', filters.campaign_id);
  query.limit(filters?.limit || 100);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as LexaCall[];
}

export async function fetchCallById(id: string): Promise<LexaCall | null> {
  const { data, error } = await supabase
    .from('lexa_calls')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as LexaCall | null;
}

// ── Leads ──────────────────────────────────────────────────

export async function fetchLeads(filters?: {
  status?: string;
  limit?: number;
}): Promise<LexaLead[]> {
  const query = supabase
    .from('lexa_leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) query.eq('status', filters.status);
  query.limit(filters?.limit || 200);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as LexaLead[];
}

export async function createLead(input: {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  tags?: string[];
  notes?: string;
}): Promise<LexaLead> {
  const { data, error } = await supabase
    .from('lexa_leads')
    .insert({
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      company: input.company || null,
      tags: input.tags || [],
      notes: input.notes || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as LexaLead;
}

export async function updateLead(
  leadId: string,
  patch: Partial<Omit<LexaLead, 'id' | 'created_at'>>
): Promise<LexaLead> {
  const { data, error } = await supabase
    .from('lexa_leads')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', leadId)
    .select()
    .single();
  if (error) throw error;
  return data as LexaLead;
}

export async function deleteLead(leadId: string): Promise<void> {
  const { error } = await supabase
    .from('lexa_leads')
    .delete()
    .eq('id', leadId);
  if (error) throw error;
}

// ── Campaigns ──────────────────────────────────────────────

export async function fetchCampaigns(filters?: {
  status?: string;
  limit?: number;
}): Promise<LexaCampaign[]> {
  const query = supabase
    .from('lexa_campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) query.eq('status', filters.status);
  query.limit(filters?.limit || 50);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as LexaCampaign[];
}

export async function createCampaign(input: {
  name: string;
  description?: string;
  agent_prompt?: string;
  from_phone?: string;
  config?: Partial<LexaCampaign['config']>;
}): Promise<LexaCampaign> {
  const { data, error } = await supabase
    .from('lexa_campaigns')
    .insert({
      name: input.name,
      description: input.description || null,
      agent_prompt: input.agent_prompt || null,
      from_phone: input.from_phone || null,
      config: {
        max_concurrent: 1,
        delay_between_calls: 30,
        retry_failed: false,
        ...(input.config || {}),
      },
    })
    .select()
    .single();
  if (error) throw error;
  return data as LexaCampaign;
}

export async function updateCampaign(
  campaignId: string,
  patch: Partial<Omit<LexaCampaign, 'id' | 'created_at'>>
): Promise<LexaCampaign> {
  const { data, error } = await supabase
    .from('lexa_campaigns')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', campaignId)
    .select()
    .single();
  if (error) throw error;
  return data as LexaCampaign;
}

// ── Daily Metrics ──────────────────────────────────────────

export async function fetchDailyMetrics(filters?: {
  from_date?: string;
  to_date?: string;
  limit?: number;
}): Promise<LexaDailyMetric[]> {
  const query = supabase
    .from('lexa_daily_metrics')
    .select('*')
    .order('date', { ascending: false });

  if (filters?.from_date) query.gte('date', filters.from_date);
  if (filters?.to_date) query.lte('date', filters.to_date);
  query.limit(filters?.limit || 30);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as LexaDailyMetric[];
}

// ── Place Call (via Edge Function) ─────────────────────────

export async function placeCall(input: {
  to_phone: string;
  from_phone?: string;
  agent_prompt?: string;
  agent_name?: string;
  campaign_id?: string;
  lead_id?: string;
  metadata?: Record<string, any>;
}): Promise<{ call_id: string; session_id: string; call: LexaCall }> {
  const apiUrl = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/lexa-api';
  const webhookSecret = import.meta.env.VITE_AGENT_COMMAND_WEBHOOK_SECRET;

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': webhookSecret,
    },
    body: JSON.stringify({
      action: 'call',
      ...input,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to place call');
  return data;
}
