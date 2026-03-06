import { supabase } from '@/integrations/supabase/client';

export type Human = {
  id: string;
  display_name: string;
  role: string | null;
};

export type AgentRecord = {
  id: string;
  name: string;
  emoji: string | null;
  can_self_register: boolean;
  self_registered: boolean;
};

export type IntegrationDoc = {
  id: string;
  slug: string;
  title: string;
  content_md: string;
  updated_by: string | null;
  updated_at: string;
};

export async function fetchHumans() {
  const { data, error } = await supabase.from('humans').select('id,display_name,role').order('created_at');
  if (error) throw error;
  return (data ?? []) as Human[];
}

export async function createHuman(display_name: string, role?: string) {
  const { error } = await supabase.from('humans').insert({ display_name, role: role || null });
  if (error) throw error;
}

export async function fetchAgents() {
  const { data, error } = await supabase
    .from('agents')
    .select('id,name,emoji,can_self_register,self_registered')
    .order('created_at');
  if (error) throw error;
  return (data ?? []) as AgentRecord[];
}

export async function registerAgent(name: string, emoji?: string) {
  const { error } = await supabase.from('agents').insert({ name, emoji: emoji || null, self_registered: true });
  if (error) throw error;
}

export async function fetchIntegrationDoc(slug: string) {
  const { data, error } = await supabase
    .from('integration_docs')
    .select('id,slug,title,content_md,updated_by,updated_at')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data as IntegrationDoc | null;
}

export async function upsertIntegrationDoc(slug: string, title: string, content_md: string, updated_by: string) {
  const { error } = await supabase.from('integration_docs').upsert(
    {
      slug,
      title,
      content_md,
      updated_by,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'slug' },
  );

  if (error) throw error;
}
