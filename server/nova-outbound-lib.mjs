import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.server' });
dotenv.config();

export const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
export const WEBHOOK_SECRET = process.env.AGENT_COMMAND_WEBHOOK_SECRET || process.env.VITE_AGENT_COMMAND_WEBHOOK_SECRET;
export const DEFAULT_BATCH_SIZE = Number(process.env.NOVA_OUTBOUND_BATCH_SIZE || 5);
export const AUTO_CREATE = process.env.NOVA_OUTBOUND_AUTO_CREATE !== 'false';
export const AUTO_RESEARCH = process.env.NOVA_OUTBOUND_AUTO_RESEARCH !== 'false';
export const AUTO_DRAFT = process.env.NOVA_OUTBOUND_AUTO_DRAFT !== 'false';
export const AUTO_SEND = process.env.NOVA_OUTBOUND_AUTO_SEND === 'true';
export const AUTO_APPROVE_THRESHOLD = Number(process.env.NOVA_OUTBOUND_AUTO_APPROVE_THRESHOLD || 0.8);
export const SEND_BATCH_SIZE = Number(process.env.NOVA_OUTBOUND_SEND_BATCH_SIZE || 10);
export const STALLED_MINUTES = Number(process.env.NOVA_OUTBOUND_STALLED_MINUTES || 15);
export const MAX_RETRIES = Number(process.env.NOVA_OUTBOUND_MAX_RETRIES || 3);
export const ENABLE_AI_LOGS = process.env.NOVA_OUTBOUND_ENABLE_AI_LOGS !== 'false';
export const AGENT_NAME = process.env.DEFAULT_AGENT_NAME || 'Rei';
export const AGENT_EMOJI = process.env.DEFAULT_AGENT_EMOJI || '🦐';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !WEBHOOK_SECRET) {
  console.error('[nova-outbound] Missing SUPABASE_URL / SUPABASE_ANON_KEY / AGENT_COMMAND_WEBHOOK_SECRET');
  process.exit(1);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function callOutbound(action, body = {}) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/nova-outbound`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': WEBHOOK_SECRET,
    },
    body: JSON.stringify({ action, ...body }),
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok || data?.error) {
    throw new Error(data?.error || `nova-outbound ${action} failed (${res.status})`);
  }

  return data;
}

export async function callAiLog(message, category = 'general', metadata = {}) {
  if (!ENABLE_AI_LOGS) return;
  const { error } = await supabase.from('ai_logs').insert({
    agent_name: AGENT_NAME,
    agent_emoji: AGENT_EMOJI,
    message,
    category,
    metadata,
  });
  if (error) {
    console.warn('[nova-outbound] ai_logs insert failed:', error.message);
  }
}

export async function fetchCompletedProspectCampaigns() {
  const { data, error } = await supabase
    .from('nova_prospect_campaigns')
    .select('id,name,status,leads_imported,updated_at,created_at')
    .eq('status', 'completed')
    .gt('leads_imported', 0)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchExistingOutboundJobs() {
  const { data, error } = await supabase
    .from('nova_outbound_jobs')
    .select('id,prospect_campaign_id,status,total_leads,researched,drafted,approved,sent,replied,error_message,updated_at,created_at,config,email_campaign_id');
  if (error) throw error;
  return data || [];
}

export async function fetchLeadsForJob(jobId) {
  const { data: job, error: jobError } = await supabase
    .from('nova_outbound_jobs')
    .select('id,prospect_campaign_id,status,config,total_leads,researched,drafted,approved,sent,replied,error_message,updated_at,created_at,email_campaign_id')
    .eq('id', jobId)
    .single();
  if (jobError) throw jobError;

  const { data: leads, error: leadError } = await supabase
    .from('nova_prospect_leads')
    .select('id,email,outbound_status,needs_review,qa_score,approved_at,sent_at,updated_at')
    .eq('campaign_id', job.prospect_campaign_id);
  if (leadError) throw leadError;

  return { job, leads: leads || [] };
}

export function summarizeLeads(leads) {
  const summary = {
    total: leads.length,
    withEmail: 0,
    pending: 0,
    researched: 0,
    review: 0,
    approved: 0,
    sent: 0,
    failed: 0,
  };

  for (const lead of leads) {
    if (lead.email) summary.withEmail += 1;
    const status = String(lead.outbound_status || 'pending');
    if (status === 'pending') summary.pending += 1;
    else if (status === 'researched') summary.researched += 1;
    else if (status === 'review') summary.review += 1;
    else if (status === 'approved') summary.approved += 1;
    else if (status === 'sent') summary.sent += 1;
    else if (status.includes('failed')) summary.failed += 1;
  }

  return summary;
}

export function jobLooksStalled(job) {
  const activeStates = new Set(['researching', 'drafting', 'sending']);
  if (!activeStates.has(String(job.status || ''))) return false;
  const updatedMs = new Date(job.updated_at || job.created_at).getTime();
  return Date.now() - updatedMs > STALLED_MINUTES * 60_000;
}

export async function processJob(job, options = {}) {
  const batchSize = options.batchSize || DEFAULT_BATCH_SIZE;
  const sendBatchSize = options.sendBatchSize || SEND_BATCH_SIZE;
  const allowSend = options.allowSend ?? AUTO_SEND;
  const result = { jobId: job.id, actions: [] };

  const { leads } = await fetchLeadsForJob(job.id);
  const summary = summarizeLeads(leads);

  if (summary.withEmail === 0) {
    result.actions.push('no_eligible_email_leads');
    return result;
  }

  if (AUTO_RESEARCH && summary.pending > 0) {
    const research = await callOutbound('research_batch', { job_id: job.id, batch_size: batchSize });
    result.actions.push({ research });
  }

  const { leads: afterResearchLeads } = await fetchLeadsForJob(job.id);
  const afterResearch = summarizeLeads(afterResearchLeads);

  if (AUTO_DRAFT && (afterResearch.researched > 0 || afterResearch.pending > 0)) {
    const draft = await callOutbound('draft_batch', { job_id: job.id, batch_size: batchSize });
    result.actions.push({ draft });
  }

  const { leads: afterDraftLeads } = await fetchLeadsForJob(job.id);
  const afterDraft = summarizeLeads(afterDraftLeads);

  if (allowSend && afterDraft.approved > 0) {
    const send = await callOutbound('send_batch', { job_id: job.id, batch_size: sendBatchSize });
    result.actions.push({ send });
  }

  return result;
}

export async function createJobForCampaign(campaign) {
  const payload = {
    prospect_campaign_id: campaign.id,
    config: {
      auto_approve_threshold: AUTO_APPROVE_THRESHOLD,
      batch_size: DEFAULT_BATCH_SIZE,
    },
  };
  return callOutbound('create_job', payload);
}
