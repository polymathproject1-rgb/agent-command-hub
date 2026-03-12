import { useState, useEffect, useCallback } from 'react';
import {
  fetchTemplates, createTemplate, updateTemplate, deleteTemplate,
  fetchSequences, createSequence, updateSequence, deleteSequence,
  fetchCampaigns, createCampaign, updateCampaign,
  fetchEmails, createEmail,
  fetchDailyMetrics,
  fetchProspectCampaigns, createProspectCampaign, runProspectCampaign,
  fetchProspectLeads, updateProspectLead, deleteProspectLead, previewProspectQuery,
  listOutboundJobs, createOutboundJob, getOutboundJob,
  researchBatch, draftBatch, sendOutboundBatch,
  approveLead, rejectLead, approveAllReview, getReviewQueue, runOutboundPipeline,
  type NovaTemplate, type NovaSequence, type NovaCampaign, type NovaEmail, type NovaDailyMetric,
  type NovaProspectCampaign, type NovaProspectLead, type NovaOutboundJob,
} from '@/features/nova/api';

export function useNovaTemplates(filters?: { category?: string; is_active?: boolean }) {
  const [templates, setTemplates] = useState<NovaTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { setTemplates(await fetchTemplates(filters)); }
    catch (err: any) { setError(err.message || 'Failed to fetch templates'); }
    finally { setLoading(false); }
  }, [filters?.category, filters?.is_active]);

  useEffect(() => { refetch(); }, [refetch]);

  const add = useCallback(async (input: Parameters<typeof createTemplate>[0]) => {
    const t = await createTemplate(input); setTemplates(prev => [t, ...prev]); return t;
  }, []);

  const edit = useCallback(async (id: string, patch: Parameters<typeof updateTemplate>[1]) => {
    const t = await updateTemplate(id, patch); setTemplates(prev => prev.map(x => x.id === id ? t : x)); return t;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteTemplate(id); setTemplates(prev => prev.filter(x => x.id !== id));
  }, []);

  return { templates, loading, error, refetch, add, edit, remove };
}

export function useNovaSequences(filters?: { status?: string }) {
  const [sequences, setSequences] = useState<NovaSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { setSequences(await fetchSequences(filters)); }
    catch (err: any) { setError(err.message || 'Failed to fetch sequences'); }
    finally { setLoading(false); }
  }, [filters?.status]);

  useEffect(() => { refetch(); }, [refetch]);

  const add = useCallback(async (input: Parameters<typeof createSequence>[0]) => {
    const s = await createSequence(input); setSequences(prev => [s, ...prev]); return s;
  }, []);

  const edit = useCallback(async (id: string, patch: Parameters<typeof updateSequence>[1]) => {
    const s = await updateSequence(id, patch); setSequences(prev => prev.map(x => x.id === id ? s : x)); return s;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteSequence(id); setSequences(prev => prev.filter(x => x.id !== id));
  }, []);

  return { sequences, loading, error, refetch, add, edit, remove };
}

export function useNovaCampaigns(filters?: { status?: string }) {
  const [campaigns, setCampaigns] = useState<NovaCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { setCampaigns(await fetchCampaigns(filters)); }
    catch (err: any) { setError(err.message || 'Failed to fetch campaigns'); }
    finally { setLoading(false); }
  }, [filters?.status]);

  useEffect(() => { refetch(); }, [refetch]);

  const add = useCallback(async (input: Parameters<typeof createCampaign>[0]) => {
    const c = await createCampaign(input); setCampaigns(prev => [c, ...prev]); return c;
  }, []);

  const edit = useCallback(async (id: string, patch: Parameters<typeof updateCampaign>[1]) => {
    const c = await updateCampaign(id, patch); setCampaigns(prev => prev.map(x => x.id === id ? c : x)); return c;
  }, []);

  return { campaigns, loading, error, refetch, add, edit };
}

export function useNovaEmails(filters?: { status?: string; campaign_id?: string; to_address?: string }) {
  const [emails, setEmails] = useState<NovaEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { setEmails(await fetchEmails(filters)); }
    catch (err: any) { setError(err.message || 'Failed to fetch emails'); }
    finally { setLoading(false); }
  }, [filters?.status, filters?.campaign_id, filters?.to_address]);

  useEffect(() => { refetch(); }, [refetch]);

  const send = useCallback(async (input: Parameters<typeof createEmail>[0]) => {
    const e = await createEmail(input); setEmails(prev => [e, ...prev]); return e;
  }, []);

  return { emails, loading, error, refetch, send };
}

export function useNovaMetrics(filters?: { from_date?: string; to_date?: string }) {
  const [metrics, setMetrics] = useState<NovaDailyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { setMetrics(await fetchDailyMetrics(filters)); }
    catch (err: any) { setError(err.message || 'Failed to fetch metrics'); }
    finally { setLoading(false); }
  }, [filters?.from_date, filters?.to_date]);

  useEffect(() => { refetch(); }, [refetch]);

  return { metrics, loading, error, refetch };
}

// ── Prospect Campaigns ────────────────────────────────────

export function useNovaProspectCampaigns() {
  const [campaigns, setCampaigns] = useState<NovaProspectCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { setCampaigns(await fetchProspectCampaigns()); }
    catch (err: any) { setError(err.message || 'Failed to fetch prospect campaigns'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const create = useCallback(async (input: Parameters<typeof createProspectCampaign>[0]) => {
    const result = await createProspectCampaign(input);
    setCampaigns(prev => [result.campaign, ...prev]);
    return result;
  }, []);

  const run = useCallback(async (campaignId: string) => {
    const result = await runProspectCampaign(campaignId);
    await refetch(); // Refresh to get updated status
    return result;
  }, [refetch]);

  const preview = useCallback(async (query: string) => {
    return previewProspectQuery(query);
  }, []);

  return { campaigns, loading, error, refetch, create, run, preview };
}

// ── Prospect Leads ────────────────────────────────────────

export function useNovaProspectLeads(filters?: { campaign_id?: string; status?: string; category?: string }) {
  const [leads, setLeads] = useState<NovaProspectLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { setLeads(await fetchProspectLeads(filters)); }
    catch (err: any) { setError(err.message || 'Failed to fetch leads'); }
    finally { setLoading(false); }
  }, [filters?.campaign_id, filters?.status, filters?.category]);

  useEffect(() => { refetch(); }, [refetch]);

  const edit = useCallback(async (id: string, patch: Parameters<typeof updateProspectLead>[1]) => {
    const l = await updateProspectLead(id, patch);
    setLeads(prev => prev.map(x => x.id === id ? l : x));
    return l;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteProspectLead(id);
    setLeads(prev => prev.filter(x => x.id !== id));
  }, []);

  return { leads, loading, error, refetch, edit, remove };
}

// ── Outbound Pipeline ─────────────────────────────────────

export function useNovaOutboundJobs() {
  const [jobs, setJobs] = useState<NovaOutboundJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await listOutboundJobs();
      setJobs(res.jobs);
    }
    catch (err: any) { setError(err.message || 'Failed to fetch outbound jobs'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const create = useCallback(async (input: Parameters<typeof createOutboundJob>[0]) => {
    const result = await createOutboundJob(input);
    setJobs(prev => [result.job, ...prev]);
    return result;
  }, []);

  const getJob = useCallback(async (jobId: string) => {
    return getOutboundJob(jobId);
  }, []);

  const research = useCallback(async (jobId: string, batchSize?: number) => {
    const result = await researchBatch(jobId, batchSize);
    await refetch();
    return result;
  }, [refetch]);

  const draft = useCallback(async (jobId: string, batchSize?: number) => {
    const result = await draftBatch(jobId, batchSize);
    await refetch();
    return result;
  }, [refetch]);

  const send = useCallback(async (jobId: string, batchSize?: number) => {
    const result = await sendOutboundBatch(jobId, batchSize);
    await refetch();
    return result;
  }, [refetch]);

  const approve = useCallback(async (leadId: string) => {
    return approveLead(leadId);
  }, []);

  const reject = useCallback(async (leadId: string, reason?: string) => {
    return rejectLead(leadId, reason);
  }, []);

  const approveAll = useCallback(async (jobId: string) => {
    const result = await approveAllReview(jobId);
    await refetch();
    return result;
  }, [refetch]);

  const reviewQueue = useCallback(async (jobId: string, limit?: number) => {
    return getReviewQueue(jobId, limit);
  }, []);

  const runPipeline = useCallback(async (jobId: string, batchSize?: number) => {
    const result = await runOutboundPipeline(jobId, batchSize);
    await refetch();
    return result;
  }, [refetch]);

  return {
    jobs, loading, error, refetch,
    create, getJob, research, draft, send,
    approve, reject, approveAll, reviewQueue, runPipeline,
  };
}
