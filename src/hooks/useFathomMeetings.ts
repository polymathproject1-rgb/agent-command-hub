import { useState, useEffect, useCallback } from 'react';

// ── Fathom API response types ──

interface FathomInvitee {
  name: string;
  email: string;
  email_domain: string;
  is_external: boolean;
  matched_speaker_display_name: string | null;
}

interface FathomRecordedBy {
  name: string;
  email: string;
  email_domain: string;
  team: string | null;
}

interface FathomActionItem {
  description: string;
  user_generated: boolean;
  completed: boolean;
  recording_timestamp: string;
  recording_playback_url: string;
  assignee: {
    name: string;
    email: string;
    team: string | null;
  };
}

interface FathomSummary {
  template_name: string;
  markdown_formatted: string;
}

interface FathomMeeting {
  title: string;
  meeting_title: string;
  url: string;
  created_at: string;
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
  recording_id: number;
  recording_start_time: string | null;
  recording_end_time: string | null;
  calendar_invitees_domains_type: string;
  transcript: string | null;
  transcript_language: string;
  default_summary: FathomSummary | null;
  action_items: FathomActionItem[] | null;
  calendar_invitees: FathomInvitee[];
  recorded_by: FathomRecordedBy;
  share_url: string | null;
  crm_matches: unknown;
}

// ── Normalized meeting type for the UI ──

export interface Meeting {
  id: string;
  type: string;
  title: string;
  date: string;
  duration_minutes: number;
  duration_display: string;
  attendees: string[];
  summary: string;
  action_items: { task: string; assignee: string; done: boolean; playback_url?: string }[];
  ai_insights: string;
  meeting_type: string;
  sentiment: string;
  has_external_participants: boolean;
  external_domains: string[];
  fathom_url: string | null;
  share_url: string | null;
}

// ── Classification ──

function classifyMeeting(title: string, attendees: FathomInvitee[], hasExternal: boolean): string {
  const t = title.toLowerCase();

  if (t.includes('standup') || t.includes('stand-up') || t.includes('daily sync')) return 'standup';
  if (t.includes('1-on-1') || t.includes('1:1') || t.includes('1on1')) return '1-on-1';
  if (attendees.length === 2) return '1-on-1';
  if (t.includes('sales') || t.includes('demo') || t.includes('pitch')) return 'sales';
  if (t.includes('planning') || t.includes('sprint') || t.includes('kickoff')) return 'planning';
  if (t.includes('retro') || t.includes('review') || t.includes('retrospective')) return 'review';
  if (t.includes('all-hands') || t.includes('all hands') || t.includes('town hall')) return 'all-hands';
  if (t.includes('interview') || t.includes('hiring')) return 'interview';
  if (t.includes('onboarding')) return 'onboarding';
  if (t.includes('workshop') || t.includes('training')) return 'workshop';
  if (t.includes('content') || t.includes('blog') || t.includes('podcast')) return 'content';
  if (hasExternal) return 'external';
  if (attendees.length > 3) return 'team';
  return 'group';
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function stripMarkdownLinks(md: string): string {
  // Convert [text](url) → text
  return md.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

function extractFirstParagraph(md: string): string {
  if (!md) return '';
  const cleaned = stripMarkdownLinks(md);
  // Get the first meaningful section (skip headers)
  const lines = cleaned.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  return lines.slice(0, 3).join(' ').trim().substring(0, 300);
}

// ── Transform Fathom → UI meeting ──

function transformMeeting(fm: FathomMeeting): Meeting {
  const invitees = fm.calendar_invitees || [];
  const hasExternal = invitees.some(i => i.is_external);
  const externalDomains = [...new Set(invitees.filter(i => i.is_external).map(i => i.email_domain))];

  let durationMinutes = 0;
  if (fm.recording_start_time && fm.recording_end_time) {
    const start = new Date(fm.recording_start_time).getTime();
    const end = new Date(fm.recording_end_time).getTime();
    durationMinutes = Math.round((end - start) / 60000);
  } else if (fm.scheduled_start_time && fm.scheduled_end_time) {
    const start = new Date(fm.scheduled_start_time).getTime();
    const end = new Date(fm.scheduled_end_time).getTime();
    durationMinutes = Math.round((end - start) / 60000);
  }

  const attendeeNames = invitees.map(i => i.name || i.email.split('@')[0]);
  const meetingType = classifyMeeting(fm.title || fm.meeting_title, invitees, hasExternal);

  // Build summary from Fathom's markdown summary
  let summary = '';
  if (fm.default_summary?.markdown_formatted) {
    summary = stripMarkdownLinks(fm.default_summary.markdown_formatted);
  }

  // Build action items
  const actionItems = (fm.action_items || []).map(ai => ({
    task: ai.description,
    assignee: ai.assignee?.name || 'Unassigned',
    done: ai.completed,
    playback_url: ai.recording_playback_url,
  }));

  // AI insights line
  const externalCount = invitees.filter(i => i.is_external).length;
  const insightParts: string[] = [];
  insightParts.push(`${formatDuration(durationMinutes)} meeting with ${attendeeNames.length} attendees`);
  if (externalCount > 0) insightParts[0] += ` (${externalCount} external)`;
  if (actionItems.length > 0) insightParts.push(`${actionItems.filter(a => !a.done).length} open action items`);

  return {
    id: String(fm.recording_id),
    type: 'meeting',
    title: fm.title || fm.meeting_title || 'Untitled Meeting',
    date: fm.recording_start_time || fm.scheduled_start_time || fm.created_at,
    duration_minutes: durationMinutes,
    duration_display: formatDuration(durationMinutes),
    attendees: attendeeNames,
    summary,
    action_items: actionItems,
    ai_insights: insightParts.join(' — '),
    meeting_type: meetingType,
    sentiment: 'neutral',
    has_external_participants: hasExternal,
    external_domains: externalDomains,
    fathom_url: fm.url || null,
    share_url: fm.share_url || null,
  };
}

// ── Hook ──

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const MAX_MEETINGS = 100;

export function useFathomMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const proxyUrl = `${SUPABASE_URL}/functions/v1/fathom-proxy`;
      const allMeetings: FathomMeeting[] = [];
      let cursor: string | null = null;

      // Paginate until we have MAX_MEETINGS or no more results
      do {
        const params = new URLSearchParams({
          path: '/meetings',
          include_summary: 'true',
          include_action_items: 'true',
        });
        if (cursor) params.set('cursor', cursor);

        const res = await fetch(`${proxyUrl}?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`Fathom proxy returned ${res.status}: ${errBody}`);
        }

        const data = await res.json();
        const items: FathomMeeting[] = data.items || [];
        allMeetings.push(...items);

        cursor = data.cursor || null;

        // Stop if we have enough
        if (allMeetings.length >= MAX_MEETINGS) break;
      } while (cursor);

      // Cap at MAX_MEETINGS
      const capped = allMeetings.slice(0, MAX_MEETINGS);
      const transformed = capped.map(transformMeeting);

      // Sort by date descending
      transformed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setMeetings(transformed);
    } catch (err) {
      console.error('[Fathom] Failed to fetch meetings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch meetings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  return { meetings, loading, error, refetch: fetchMeetings };
}
