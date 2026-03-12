import { useState, useEffect, useCallback } from 'react';
import {
  fetchCalls,
  fetchLeads,
  fetchCampaigns,
  fetchDailyMetrics,
  placeCall,
  createLead,
  updateLead,
  deleteLead,
  createCampaign,
  updateCampaign,
  type LexaCall,
  type LexaLead,
  type LexaCampaign,
  type LexaDailyMetric,
} from '@/features/lexa/api';

export function useLexaCalls(filters?: { status?: string; agent_name?: string; campaign_id?: string }) {
  const [calls, setCalls] = useState<LexaCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCalls(filters);
      setCalls(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch calls');
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.agent_name, filters?.campaign_id]);

  useEffect(() => { refetch(); }, [refetch]);

  return { calls, loading, error, refetch };
}

export function useLexaLeads(filters?: { status?: string }) {
  const [leads, setLeads] = useState<LexaLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeads(filters);
      setLeads(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [filters?.status]);

  useEffect(() => { refetch(); }, [refetch]);

  const addLead = useCallback(async (input: Parameters<typeof createLead>[0]) => {
    const lead = await createLead(input);
    setLeads((prev) => [lead, ...prev]);
    return lead;
  }, []);

  const editLead = useCallback(async (id: string, patch: Parameters<typeof updateLead>[1]) => {
    const lead = await updateLead(id, patch);
    setLeads((prev) => prev.map((l) => (l.id === id ? lead : l)));
    return lead;
  }, []);

  const removeLead = useCallback(async (id: string) => {
    await deleteLead(id);
    setLeads((prev) => prev.filter((l) => l.id !== id));
  }, []);

  return { leads, loading, error, refetch, addLead, editLead, removeLead };
}

export function useLexaCampaigns(filters?: { status?: string }) {
  const [campaigns, setCampaigns] = useState<LexaCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCampaigns(filters);
      setCampaigns(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  }, [filters?.status]);

  useEffect(() => { refetch(); }, [refetch]);

  const addCampaign = useCallback(async (input: Parameters<typeof createCampaign>[0]) => {
    const campaign = await createCampaign(input);
    setCampaigns((prev) => [campaign, ...prev]);
    return campaign;
  }, []);

  const editCampaign = useCallback(async (id: string, patch: Parameters<typeof updateCampaign>[1]) => {
    const campaign = await updateCampaign(id, patch);
    setCampaigns((prev) => prev.map((c) => (c.id === id ? campaign : c)));
    return campaign;
  }, []);

  return { campaigns, loading, error, refetch, addCampaign, editCampaign };
}

export function useLexaMetrics(filters?: { from_date?: string; to_date?: string }) {
  const [metrics, setMetrics] = useState<LexaDailyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDailyMetrics(filters);
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }, [filters?.from_date, filters?.to_date]);

  useEffect(() => { refetch(); }, [refetch]);

  return { metrics, loading, error, refetch };
}

export function usePlaceCall() {
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(async (input: Parameters<typeof placeCall>[0]) => {
    setPlacing(true);
    setError(null);
    try {
      const result = await placeCall(input);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to place call');
      throw err;
    } finally {
      setPlacing(false);
    }
  }, []);

  return { call, placing, error };
}
