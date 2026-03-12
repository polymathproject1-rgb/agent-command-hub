import { supabase } from '@/integrations/supabase/client';

// ── Types ──────────────────────────────────────────────────

export type NovaTemplate = {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  variables: string[];
  category: string;
  tags: string[];
  usage_count: number;
  avg_open_rate: number;
  avg_reply_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type NovaSequenceStep = {
  step: number;
  template_id: string;
  delay_days: number;
  condition: 'none' | 'no_reply' | 'no_open' | 'replied' | 'opened';
};

export type NovaSequence = {
  id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'active' | 'paused' | 'archived';
  steps: NovaSequenceStep[];
  total_enrolled: number;
  active_count: number;
  completed_count: number;
  stopped_count: number;
  created_at: string;
  updated_at: string;
};

export type NovaCampaign = {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  sequence_id: string | null;
  template_id: string | null;
  from_address: string;
  total_leads: number;
  emails_sent: number;
  emails_delivered: number;
  emails_opened: number;
  emails_clicked: number;
  emails_replied: number;
  emails_bounced: number;
  meetings_booked: number;
  open_rate: number;
  click_rate: number;
  reply_rate: number;
  send_limit_per_day: number;
  send_window_start: string;
  send_window_end: string;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type NovaEmail = {
  id: string;
  resend_id: string | null;
  campaign_id: string | null;
  template_id: string | null;
  sequence_id: string | null;
  step_number: number;
  from_address: string;
  to_address: string;
  to_name: string | null;
  subject: string;
  body_html: string | null;
  personalization_fields: Record<string, any>;
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'complained' | 'failed';
  sent_at: string | null;
  delivered_at: string | null;
  first_open_at: string | null;
  open_count: number;
  clicked_at: string | null;
  click_count: number;
  replied_at: string | null;
  bounced_at: string | null;
  meeting_booked: boolean;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type NovaDailyMetric = {
  id: string;
  date: string;
  emails_sent: number;
  emails_delivered: number;
  emails_opened: number;
  emails_clicked: number;
  emails_replied: number;
  emails_bounced: number;
  meetings_booked: number;
  open_rate: number;
  click_rate: number;
  reply_rate: number;
  bounce_rate: number;
  top_template_id: string | null;
  created_at: string;
};

// ── Templates ─────────────────────────────────────────────

export async function fetchTemplates(filters?: { category?: string; is_active?: boolean; limit?: number }): Promise<NovaTemplate[]> {
  const query = supabase.from('nova_templates').select('*').order('created_at', { ascending: false });
  if (filters?.category) query.eq('category', filters.category);
  if (filters?.is_active !== undefined) query.eq('is_active', filters.is_active);
  query.limit(filters?.limit || 100);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as NovaTemplate[];
}

export async function createTemplate(input: {
  name: string; subject: string; body_html: string; body_text?: string;
  variables?: string[]; category?: string; tags?: string[];
}): Promise<NovaTemplate> {
  const { data, error } = await supabase.from('nova_templates').insert({
    name: input.name, subject: input.subject, body_html: input.body_html,
    body_text: input.body_text || '', variables: input.variables || [],
    category: input.category || 'outreach', tags: input.tags || [],
  }).select().single();
  if (error) throw error;
  return data as NovaTemplate;
}

export async function updateTemplate(id: string, patch: Partial<Omit<NovaTemplate, 'id' | 'created_at'>>): Promise<NovaTemplate> {
  const { data, error } = await supabase.from('nova_templates')
    .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data as NovaTemplate;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('nova_templates').delete().eq('id', id);
  if (error) throw error;
}

// ── Sequences ─────────────────────────────────────────────

export async function fetchSequences(filters?: { status?: string; limit?: number }): Promise<NovaSequence[]> {
  const query = supabase.from('nova_sequences').select('*').order('created_at', { ascending: false });
  if (filters?.status) query.eq('status', filters.status);
  query.limit(filters?.limit || 50);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as NovaSequence[];
}

export async function createSequence(input: {
  name: string; description?: string; steps?: NovaSequenceStep[];
}): Promise<NovaSequence> {
  const { data, error } = await supabase.from('nova_sequences').insert({
    name: input.name, description: input.description || null, steps: input.steps || [],
  }).select().single();
  if (error) throw error;
  return data as NovaSequence;
}

export async function updateSequence(id: string, patch: Partial<Omit<NovaSequence, 'id' | 'created_at'>>): Promise<NovaSequence> {
  const { data, error } = await supabase.from('nova_sequences')
    .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data as NovaSequence;
}

export async function deleteSequence(id: string): Promise<void> {
  const { error } = await supabase.from('nova_sequences').delete().eq('id', id);
  if (error) throw error;
}

// ── Campaigns ─────────────────────────────────────────────

export async function fetchCampaigns(filters?: { status?: string; limit?: number }): Promise<NovaCampaign[]> {
  const query = supabase.from('nova_campaigns').select('*').order('created_at', { ascending: false });
  if (filters?.status) query.eq('status', filters.status);
  query.limit(filters?.limit || 50);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as NovaCampaign[];
}

export async function createCampaign(input: {
  name: string; from_address: string; sequence_id?: string; template_id?: string;
  total_leads?: number; send_limit_per_day?: number; timezone?: string;
}): Promise<NovaCampaign> {
  const { data, error } = await supabase.from('nova_campaigns').insert({
    name: input.name, from_address: input.from_address,
    sequence_id: input.sequence_id || null, template_id: input.template_id || null,
    total_leads: input.total_leads || 0, send_limit_per_day: input.send_limit_per_day || 50,
    timezone: input.timezone || 'America/Vancouver',
  }).select().single();
  if (error) throw error;
  return data as NovaCampaign;
}

export async function updateCampaign(id: string, patch: Partial<Omit<NovaCampaign, 'id' | 'created_at'>>): Promise<NovaCampaign> {
  const { data, error } = await supabase.from('nova_campaigns')
    .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data as NovaCampaign;
}

// ── Emails ────────────────────────────────────────────────

export async function fetchEmails(filters?: {
  status?: string; campaign_id?: string; to_address?: string; limit?: number;
}): Promise<NovaEmail[]> {
  const query = supabase.from('nova_emails').select('*').order('created_at', { ascending: false });
  if (filters?.status) query.eq('status', filters.status);
  if (filters?.campaign_id) query.eq('campaign_id', filters.campaign_id);
  if (filters?.to_address) query.ilike('to_address', `%${filters.to_address}%`);
  query.limit(filters?.limit || 200);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as NovaEmail[];
}

export async function createEmail(input: {
  from_address: string; to_address: string; to_name?: string; subject: string;
  body_html?: string; campaign_id?: string; template_id?: string;
  personalization_fields?: Record<string, any>;
}): Promise<NovaEmail> {
  const { data, error } = await supabase.from('nova_emails').insert({
    from_address: input.from_address, to_address: input.to_address,
    to_name: input.to_name || null, subject: input.subject,
    body_html: input.body_html || '', campaign_id: input.campaign_id || null,
    template_id: input.template_id || null,
    personalization_fields: input.personalization_fields || {},
  }).select().single();
  if (error) throw error;
  return data as NovaEmail;
}

// ── Daily Metrics ─────────────────────────────────────────

export async function fetchDailyMetrics(filters?: {
  from_date?: string; to_date?: string; limit?: number;
}): Promise<NovaDailyMetric[]> {
  const query = supabase.from('nova_daily_metrics').select('*').order('date', { ascending: false });
  if (filters?.from_date) query.gte('date', filters.from_date);
  if (filters?.to_date) query.lte('date', filters.to_date);
  query.limit(filters?.limit || 30);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as NovaDailyMetric[];
}

// ── Prospecting Types ──────────────────────────────────────

export type NovaProspectCampaign = {
  id: string;
  name: string;
  description: string | null;
  search_query: string;
  structured_query: { searchTerms: string[]; location: string; maxResults: number } | null;
  apify_actor_id: string;
  apify_run_id: string | null;
  status: 'draft' | 'searching' | 'completed' | 'failed';
  total_leads_found: number;
  leads_imported: number;
  config: Record<string, any>;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type NovaProspectLead = {
  id: string;
  campaign_id: string;
  business_name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  category: string | null;
  rating: number | null;
  review_count: number;
  tags: string[];
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'dnc';
  metadata: Record<string, any>;
  // Outbound pipeline fields
  outbound_status: 'pending' | 'researched' | 'research_failed' | 'review' | 'approved' | 'sent' | 'send_failed' | 'replied' | 'followup';
  research_data: {
    website_summary?: string;
    observed_gap?: string;
    personalization_opener?: string;
    offer_angle?: string;
    cta_angle?: string;
    confidence?: number;
    error?: string;
  };
  draft_subject: string | null;
  draft_body_html: string | null;
  qa_score: number | null;
  needs_review: boolean;
  approved_at: string | null;
  sent_at: string | null;
  sent_email_id: string | null;
  followup_due_at: string | null;
  followup_step: number;
  reply_classification: string | null;
  created_at: string;
  updated_at: string;
};

// ── Outbound Job Types ──────────────────────────────────────

export type NovaOutboundJob = {
  id: string;
  prospect_campaign_id: string;
  email_campaign_id: string | null;
  template_id: string | null;
  status: 'created' | 'researching' | 'researched' | 'drafting' | 'drafted' | 'review' | 'sending' | 'active' | 'completed' | 'paused';
  config: {
    auto_approve_threshold?: number;
    batch_size?: number;
    send_window?: { start: string; end: string };
  };
  total_leads: number;
  researched: number;
  drafted: number;
  approved: number;
  sent: number;
  replied: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations (from list_jobs)
  nova_prospect_campaigns?: { name: string };
  nova_campaigns?: { name: string; emails_sent: number; emails_opened: number; emails_clicked: number };
};

// ── Prospect Campaigns ────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const WEBHOOK_SECRET = import.meta.env.VITE_AGENT_COMMAND_WEBHOOK_SECRET || '';

async function prospectApi(action: string, body: Record<string, any> = {}) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/nova-prospect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': WEBHOOK_SECRET,
    },
    body: JSON.stringify({ action, ...body }),
  });
  const data = await resp.json();
  if (!resp.ok || data.error) throw new Error(data.error || 'Prospect API error');
  return data;
}

export async function createProspectCampaign(input: {
  name: string; query: string; description?: string; max_results?: number;
}): Promise<{ campaign: NovaProspectCampaign; structured_query: any }> {
  return prospectApi('create_campaign', input);
}

export async function runProspectCampaign(campaignId: string): Promise<{
  success: boolean; run_id: string; total_found: number; imported: number;
}> {
  return prospectApi('run_campaign', { campaign_id: campaignId });
}

export async function previewProspectQuery(query: string): Promise<{
  structured_query: { searchTerms: string[]; location: string; maxResults: number };
}> {
  return prospectApi('preview_query', { query });
}

export async function fetchProspectCampaigns(): Promise<NovaProspectCampaign[]> {
  const { data, error } = await supabase
    .from('nova_prospect_campaigns')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as NovaProspectCampaign[];
}

export async function fetchProspectLeads(filters?: {
  campaign_id?: string; status?: string; category?: string; limit?: number;
}): Promise<NovaProspectLead[]> {
  let query = supabase.from('nova_prospect_leads').select('*').order('created_at', { ascending: false });
  if (filters?.campaign_id) query = query.eq('campaign_id', filters.campaign_id);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.category) query = query.eq('category', filters.category);
  query = query.limit(filters?.limit || 200);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as NovaProspectLead[];
}

export async function updateProspectLead(id: string, patch: Partial<Pick<NovaProspectLead, 'status' | 'tags'>>): Promise<NovaProspectLead> {
  const { data, error } = await supabase.from('nova_prospect_leads')
    .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data as NovaProspectLead;
}

export async function deleteProspectLead(id: string): Promise<void> {
  const { error } = await supabase.from('nova_prospect_leads').delete().eq('id', id);
  if (error) throw error;
}

export async function exportLeadsForCampaign(campaignId: string): Promise<{
  leads_with_email: number;
  leads: Array<{ id: string; name: string; email: string; phone: string; company: string; category: string; city: string; state: string }>;
}> {
  return prospectApi('export_to_campaign', { campaign_id: campaignId });
}

// ── Outbound Pipeline API ─────────────────────────────────

async function outboundApi(action: string, body: Record<string, any> = {}) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/nova-outbound`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': WEBHOOK_SECRET,
    },
    body: JSON.stringify({ action, ...body }),
  });
  const data = await resp.json();
  if (!resp.ok || data.error) throw new Error(data.error || 'Outbound API error');
  return data;
}

export async function createOutboundJob(input: {
  prospect_campaign_id: string; template_id?: string; config?: Record<string, any>;
}): Promise<{ job: NovaOutboundJob; email_campaign: NovaCampaign }> {
  return outboundApi('create_job', input);
}

export async function researchBatch(jobId: string, batchSize?: number): Promise<{
  researched: number; total_in_batch: number; results: any[];
}> {
  return outboundApi('research_batch', { job_id: jobId, batch_size: batchSize });
}

export async function draftBatch(jobId: string, batchSize?: number): Promise<{
  drafted: number; total_in_batch: number; results: any[];
}> {
  return outboundApi('draft_batch', { job_id: jobId, batch_size: batchSize });
}

export async function sendOutboundBatch(jobId: string, batchSize?: number): Promise<{
  sent: number; total_in_batch: number; results: any[];
}> {
  return outboundApi('send_batch', { job_id: jobId, batch_size: batchSize });
}

export async function approveLead(leadId: string): Promise<{ approved: boolean }> {
  return outboundApi('approve_lead', { lead_id: leadId });
}

export async function rejectLead(leadId: string, reason?: string): Promise<{ rejected: boolean }> {
  return outboundApi('reject_lead', { lead_id: leadId, reason });
}

export async function approveAllReview(jobId: string): Promise<{ approved: number }> {
  return outboundApi('approve_all_review', { job_id: jobId });
}

export async function getOutboundJob(jobId: string): Promise<{
  job: NovaOutboundJob; lead_counts: Record<string, number>;
}> {
  return outboundApi('get_job', { job_id: jobId });
}

export async function listOutboundJobs(): Promise<{ jobs: NovaOutboundJob[] }> {
  return outboundApi('list_jobs');
}

export async function getReviewQueue(jobId: string, limit?: number): Promise<{
  leads: NovaProspectLead[]; count: number;
}> {
  return outboundApi('review_queue', { job_id: jobId, limit });
}

export async function runOutboundPipeline(jobId: string, batchSize?: number): Promise<{
  pipeline: {
    research: { processed: number; researched: number } | null;
    draft: { processed: number; drafted: number } | null;
    send: { processed: number; sent: number } | null;
  };
}> {
  return outboundApi('run_pipeline', { job_id: jobId, batch_size: batchSize });
}
