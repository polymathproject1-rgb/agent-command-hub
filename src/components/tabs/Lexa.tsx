import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneOutgoing,
  Users,
  UserPlus,
  Megaphone,
  BarChart3,
  MessageSquare,
  Clock,
  DollarSign,
  TrendingUp,
  Smile,
  Meh,
  Frown,
  Plus,
  Trash2,
  Edit,
  Search,
  Filter,
  Play,
  Pause,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import GlassCard from '@/components/GlassCard';
import { useLexaCalls, useLexaLeads, useLexaCampaigns, useLexaMetrics, usePlaceCall } from '@/hooks/useLexa';
import type { LexaCall, LexaLead, LexaCampaign } from '@/features/lexa/api';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

// ─── Helpers ────────────────────────────────────────────────

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function callStatusColor(status: string): string {
  switch (status) {
    case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'in-progress': case 'initiated': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'user-ended': case 'api-ended': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'error': case 'timeout': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  }
}

function sentimentIcon(sentiment: string | null) {
  switch (sentiment) {
    case 'positive': return <Smile size={14} className="text-emerald-400" />;
    case 'negative': return <Frown size={14} className="text-red-400" />;
    default: return <Meh size={14} className="text-amber-400" />;
  }
}

function leadStatusColor(status: string): string {
  switch (status) {
    case 'new': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'contacted': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'qualified': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'converted': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'dnc': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  }
}

function campaignStatusColor(status: string): string {
  switch (status) {
    case 'running': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'paused': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'draft': return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  }
}

// ─── Place Call Dialog ──────────────────────────────────────

function PlaceCallDialog({ onCallPlaced }: { onCallPlaced: () => void }) {
  const [open, setOpen] = useState(false);
  const [toPhone, setToPhone] = useState('');
  const [fromPhone, setFromPhone] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentName, setAgentName] = useState('');
  const { call, placing, error } = usePlaceCall();

  const handleCall = async () => {
    if (!toPhone.trim()) return;
    try {
      await call({
        to_phone: toPhone.trim(),
        from_phone: fromPhone.trim() || undefined,
        agent_prompt: agentPrompt.trim() || undefined,
        agent_name: agentName.trim() || undefined,
      });
      setToPhone('');
      setFromPhone('');
      setAgentPrompt('');
      setAgentName('');
      setOpen(false);
      onCallPlaced();
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors text-sm font-medium border border-teal-500/30">
          <PhoneOutgoing size={16} /> Place Call
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Phone size={18} className="text-teal-400" /> Place Outbound Call</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {error && (
            <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}
          <div>
            <Label className="text-xs text-muted-foreground">To Phone *</Label>
            <Input value={toPhone} onChange={(e) => setToPhone(e.target.value)} placeholder="+1234567890" className="mt-1 bg-secondary/30 border-secondary/50" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">From Phone (optional)</Label>
            <Input value={fromPhone} onChange={(e) => setFromPhone(e.target.value)} placeholder="Telnyx number" className="mt-1 bg-secondary/30 border-secondary/50" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Agent Name (optional)</Label>
            <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="e.g. Bujji, Rei" className="mt-1 bg-secondary/30 border-secondary/50" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Agent Prompt (optional override)</Label>
            <Textarea value={agentPrompt} onChange={(e) => setAgentPrompt(e.target.value)} placeholder="Custom instructions for this call..." className="mt-1 bg-secondary/30 border-secondary/50 min-h-[80px]" />
          </div>
          <button
            onClick={handleCall}
            disabled={!toPhone.trim() || placing}
            className="w-full py-2 rounded-lg bg-teal-600 text-white font-medium text-sm hover:bg-teal-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {placing ? <><Loader2 size={16} className="animate-spin" /> Calling...</> : <><PhoneCall size={16} /> Call Now</>}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Lead Dialog ────────────────────────────────────────

function AddLeadDialog({ onAdd }: { onAdd: (input: { name: string; phone: string; email?: string; company?: string; notes?: string }) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!name.trim() || !phone.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onAdd({ name: name.trim(), phone: phone.trim(), email: email.trim() || undefined, company: company.trim() || undefined, notes: notes.trim() || undefined });
      setName(''); setPhone(''); setEmail(''); setCompany(''); setNotes('');
      setOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium">
          <UserPlus size={16} /> Add Lead
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-white/10">
        <DialogHeader><DialogTitle>Add Lead</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          {error && <div className="p-2 rounded bg-destructive/10 border border-destructive/20"><p className="text-xs text-destructive">{error}</p></div>}
          <div><Label className="text-xs text-muted-foreground">Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="mt-1 bg-secondary/30 border-secondary/50" /></div>
          <div><Label className="text-xs text-muted-foreground">Phone *</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1234567890" className="mt-1 bg-secondary/30 border-secondary/50" /></div>
          <div><Label className="text-xs text-muted-foreground">Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" className="mt-1 bg-secondary/30 border-secondary/50" /></div>
          <div><Label className="text-xs text-muted-foreground">Company</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Corp" className="mt-1 bg-secondary/30 border-secondary/50" /></div>
          <div><Label className="text-xs text-muted-foreground">Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 bg-secondary/30 border-secondary/50 min-h-[60px]" /></div>
          <button onClick={handleAdd} disabled={!name.trim() || !phone.trim() || saving} className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving ? 'Adding…' : 'Add Lead'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create Campaign Dialog ─────────────────────────────────

function CreateCampaignDialog({ onAdd }: { onAdd: (input: { name: string; description?: string; agent_prompt?: string; from_phone?: string }) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [fromPhone, setFromPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onAdd({ name: name.trim(), description: description.trim() || undefined, agent_prompt: agentPrompt.trim() || undefined, from_phone: fromPhone.trim() || undefined });
      setName(''); setDescription(''); setAgentPrompt(''); setFromPhone('');
      setOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium">
          <Plus size={16} /> New Campaign
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-white/10">
        <DialogHeader><DialogTitle>Create Campaign</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          {error && <div className="p-2 rounded bg-destructive/10 border border-destructive/20"><p className="text-xs text-destructive">{error}</p></div>}
          <div><Label className="text-xs text-muted-foreground">Campaign Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Q1 Outreach" className="mt-1 bg-secondary/30 border-secondary/50" /></div>
          <div><Label className="text-xs text-muted-foreground">Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 bg-secondary/30 border-secondary/50 min-h-[60px]" /></div>
          <div><Label className="text-xs text-muted-foreground">From Phone</Label><Input value={fromPhone} onChange={(e) => setFromPhone(e.target.value)} placeholder="Telnyx number" className="mt-1 bg-secondary/30 border-secondary/50" /></div>
          <div><Label className="text-xs text-muted-foreground">Agent Prompt</Label><Textarea value={agentPrompt} onChange={(e) => setAgentPrompt(e.target.value)} placeholder="Instructions for the AI agent on these calls..." className="mt-1 bg-secondary/30 border-secondary/50 min-h-[80px]" /></div>
          <button onClick={handleCreate} disabled={!name.trim() || saving} className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving ? 'Creating…' : 'Create Campaign'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dashboard Tab ──────────────────────────────────────────

function DashboardTab() {
  const { calls, loading: callsLoading } = useLexaCalls();
  const { metrics } = useLexaMetrics();

  const stats = useMemo(() => {
    const totalCalls = calls.length;
    const completed = calls.filter((c) => c.status === 'completed' || c.status === 'user-ended' || c.status === 'api-ended');
    const avgDuration = completed.length > 0
      ? Math.round(completed.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / completed.length)
      : 0;
    const totalCost = calls.reduce((sum, c) => sum + (c.cost || 0), 0);
    const answerRate = totalCalls > 0
      ? Math.round((completed.length / totalCalls) * 100)
      : 0;
    const sentiments = { positive: 0, neutral: 0, negative: 0 };
    calls.forEach((c) => {
      if (c.sentiment === 'positive') sentiments.positive++;
      else if (c.sentiment === 'negative') sentiments.negative++;
      else sentiments.neutral++;
    });
    return { totalCalls, avgDuration, totalCost, answerRate, sentiments };
  }, [calls]);

  const recentCalls = calls.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Calls', value: stats.totalCalls, icon: Phone, color: 'text-teal-400' },
          { label: 'Avg Duration', value: formatDuration(stats.avgDuration), icon: Clock, color: 'text-blue-400' },
          { label: 'Answer Rate', value: `${stats.answerRate}%`, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Total Cost', value: `$${stats.totalCost.toFixed(2)}`, icon: DollarSign, color: 'text-amber-400' },
        ].map((kpi) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-white/5 ${kpi.color}`}>
                  <kpi.icon size={20} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-xl font-bold">{kpi.value}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Sentiment Breakdown */}
      <GlassCard className="p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><BarChart3 size={16} className="text-teal-400" /> Sentiment Breakdown</h3>
        <div className="flex gap-6">
          {[
            { label: 'Positive', count: stats.sentiments.positive, icon: <Smile size={18} className="text-emerald-400" />, color: 'bg-emerald-500' },
            { label: 'Neutral', count: stats.sentiments.neutral, icon: <Meh size={18} className="text-amber-400" />, color: 'bg-amber-500' },
            { label: 'Negative', count: stats.sentiments.negative, icon: <Frown size={18} className="text-red-400" />, color: 'bg-red-500' },
          ].map((s) => {
            const total = stats.totalCalls || 1;
            const pct = Math.round((s.count / total) * 100);
            return (
              <div key={s.label} className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {s.icon}
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <span className="text-xs font-bold ml-auto">{s.count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Recent Calls */}
      <GlassCard className="p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><PhoneCall size={16} className="text-teal-400" /> Recent Calls</h3>
        {callsLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
        ) : recentCalls.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No calls yet. Place your first call to get started.</p>
        ) : (
          <div className="space-y-2">
            {recentCalls.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <Badge className={`text-[10px] px-1.5 py-0.5 border ${callStatusColor(c.status)}`}>{c.status}</Badge>
                <span className="text-sm font-mono">{c.to_phone || '—'}</span>
                <span className="text-xs text-muted-foreground">{formatDuration(c.duration_seconds)}</span>
                {sentimentIcon(c.sentiment)}
                {c.agent_name && <span className="text-xs text-muted-foreground ml-auto">{c.agent_name}</span>}
                <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(parseISO(c.created_at), { addSuffix: true })}</span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

// ─── Call Log Tab ───────────────────────────────────────────

function CallLogTab() {
  const { calls, loading, refetch } = useLexaCalls();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = calls;
    if (statusFilter) result = result.filter((c) => c.status === statusFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter((c) =>
        (c.to_phone || '').toLowerCase().includes(q) ||
        (c.agent_name || '').toLowerCase().includes(q) ||
        (c.from_phone || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [calls, statusFilter, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <PlaceCallDialog onCallPlaced={refetch} />
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by phone or agent..." className="pl-8 bg-secondary/30 border-secondary/50 text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-secondary/30 border border-secondary/50 text-sm text-foreground">
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="in-progress">In Progress</option>
          <option value="initiated">Initiated</option>
          <option value="user-ended">User Ended</option>
          <option value="error">Error</option>
        </select>
        <button onClick={refetch} className="p-2 rounded-lg hover:bg-white/5 transition-colors"><RefreshCw size={16} className="text-muted-foreground" /></button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-8 text-center"><p className="text-sm text-muted-foreground">No calls found.</p></GlassCard>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <GlassCard key={c.id} className="p-0 overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[0.02] transition-colors"
              >
                {expandedId === c.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <Badge className={`text-[10px] px-1.5 py-0.5 border ${callStatusColor(c.status)}`}>{c.status}</Badge>
                <span className="text-sm font-mono flex-1">{c.to_phone || '—'}</span>
                {sentimentIcon(c.sentiment)}
                <span className="text-xs text-muted-foreground">{formatDuration(c.duration_seconds)}</span>
                {c.cost != null && <span className="text-xs text-muted-foreground">${Number(c.cost).toFixed(3)}</span>}
                {c.agent_name && <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">{c.agent_name}</span>}
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDistanceToNow(parseISO(c.created_at), { addSuffix: true })}</span>
              </button>
              {expandedId === c.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-white/5 p-4 bg-white/[0.01]">
                  <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                    <div><span className="text-muted-foreground">From:</span> <span className="font-mono">{c.from_phone || '—'}</span></div>
                    <div><span className="text-muted-foreground">To:</span> <span className="font-mono">{c.to_phone || '—'}</span></div>
                    <div><span className="text-muted-foreground">Direction:</span> {c.direction}</div>
                    <div><span className="text-muted-foreground">Session:</span> <span className="font-mono text-[10px]">{c.session_id || '—'}</span></div>
                  </div>
                  {c.transcript && c.transcript.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-2 text-teal-400">Transcript</p>
                      <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                        {c.transcript.map((msg, i) => (
                          <div key={i} className={`flex gap-2 text-xs ${msg.role === 'assistant' ? 'pl-4' : ''}`}>
                            <span className={`font-semibold min-w-[60px] ${msg.role === 'assistant' ? 'text-teal-400' : 'text-blue-400'}`}>
                              {msg.role === 'assistant' ? 'Lexa' : 'Caller'}:
                            </span>
                            <span className="text-foreground/80">{msg.content}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {c.recording_url && (
                    <a href={c.recording_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-teal-400 hover:underline">
                      🎙️ Listen to recording
                    </a>
                  )}
                </motion.div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Leads Tab ──────────────────────────────────────────────

function LeadsTab() {
  const { leads, loading, refetch, addLead, editLead, removeLead } = useLexaLeads();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filtered = useMemo(() => {
    let result = leads;
    if (statusFilter) result = result.filter((l) => l.status === statusFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter((l) =>
        l.name.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        (l.company || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [leads, statusFilter, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <AddLeadDialog onAdd={addLead} />
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search leads..." className="pl-8 bg-secondary/30 border-secondary/50 text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-secondary/30 border border-secondary/50 text-sm text-foreground">
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="converted">Converted</option>
          <option value="dnc">DNC</option>
        </select>
        <button onClick={refetch} className="p-2 rounded-lg hover:bg-white/5 transition-colors"><RefreshCw size={16} className="text-muted-foreground" /></button>
      </div>

      <div className="text-xs text-muted-foreground">{filtered.length} lead{filtered.length !== 1 ? 's' : ''}</div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-8 text-center"><p className="text-sm text-muted-foreground">No leads yet. Add your first lead to get started.</p></GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((lead) => (
            <GlassCard key={lead.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{lead.name}</p>
                  <p className="text-xs font-mono text-muted-foreground">{lead.phone}</p>
                </div>
                <Badge className={`text-[10px] px-1.5 py-0.5 border ${leadStatusColor(lead.status)}`}>{lead.status}</Badge>
              </div>
              {lead.company && <p className="text-xs text-muted-foreground mb-1">🏢 {lead.company}</p>}
              {lead.email && <p className="text-xs text-muted-foreground mb-1">✉️ {lead.email}</p>}
              {lead.tags && lead.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-2">
                  {lead.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">{tag}</span>
                  ))}
                </div>
              )}
              {lead.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{lead.notes}</p>}
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
                <button
                  onClick={() => removeLead(lead.id)}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <Trash2 size={12} /> Delete
                </button>
                <span className="text-[10px] text-muted-foreground ml-auto">{formatDistanceToNow(parseISO(lead.created_at), { addSuffix: true })}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Campaigns Tab ──────────────────────────────────────────

function CampaignsTab() {
  const { campaigns, loading, refetch, addCampaign, editCampaign } = useLexaCampaigns();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <CreateCampaignDialog onAdd={addCampaign} />
        <button onClick={refetch} className="p-2 rounded-lg hover:bg-white/5 transition-colors"><RefreshCw size={16} className="text-muted-foreground" /></button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
      ) : campaigns.length === 0 ? (
        <GlassCard className="p-8 text-center"><p className="text-sm text-muted-foreground">No campaigns yet. Create your first campaign.</p></GlassCard>
      ) : (
        <div className="space-y-3">
          {campaigns.map((camp) => {
            const progress = camp.total_leads > 0
              ? Math.round((camp.completed_leads / camp.total_leads) * 100)
              : 0;
            return (
              <GlassCard key={camp.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm flex items-center gap-2">
                      <Megaphone size={14} className="text-teal-400" /> {camp.name}
                    </p>
                    {camp.description && <p className="text-xs text-muted-foreground mt-0.5">{camp.description}</p>}
                  </div>
                  <Badge className={`text-[10px] px-1.5 py-0.5 border ${campaignStatusColor(camp.status)}`}>{camp.status}</Badge>
                </div>

                {camp.total_leads > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-mono">{camp.completed_leads}/{camp.total_leads} ({progress}%)</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                {camp.from_phone && <p className="text-xs text-muted-foreground mt-2">📞 From: <span className="font-mono">{camp.from_phone}</span></p>}

                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
                  {camp.status === 'draft' || camp.status === 'paused' ? (
                    <button
                      onClick={() => editCampaign(camp.id, { status: 'running' })}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <Play size={12} /> Start
                    </button>
                  ) : camp.status === 'running' ? (
                    <button
                      onClick={() => editCampaign(camp.id, { status: 'paused' })}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <Pause size={12} /> Pause
                    </button>
                  ) : null}
                  <span className="text-[10px] text-muted-foreground ml-auto">{formatDistanceToNow(parseISO(camp.created_at), { addSuffix: true })}</span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Transcripts Tab ────────────────────────────────────────

function TranscriptsTab() {
  const { calls, loading } = useLexaCalls();
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);

  const callsWithTranscript = calls.filter((c) => c.transcript && c.transcript.length > 0);
  const selectedCall = callsWithTranscript.find((c) => c.id === selectedCallId) || callsWithTranscript[0] || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[400px]">
      {/* Call List */}
      <GlassCard className="p-3 lg:col-span-1 overflow-y-auto max-h-[600px]">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><MessageSquare size={14} className="text-teal-400" /> Calls with Transcripts</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
        ) : callsWithTranscript.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No transcripts available yet.</p>
        ) : (
          <div className="space-y-1">
            {callsWithTranscript.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCallId(c.id)}
                className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                  selectedCall?.id === c.id ? 'bg-teal-500/10 border border-teal-500/20' : 'hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono">{c.to_phone}</span>
                  {sentimentIcon(c.sentiment)}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
                  <span>{formatDuration(c.duration_seconds)}</span>
                  <span>·</span>
                  <span>{formatDistanceToNow(parseISO(c.created_at), { addSuffix: true })}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Transcript Viewer */}
      <GlassCard className="p-4 lg:col-span-2 overflow-y-auto max-h-[600px]">
        {selectedCall ? (
          <div>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/5">
              <Phone size={16} className="text-teal-400" />
              <span className="font-mono text-sm">{selectedCall.to_phone}</span>
              <Badge className={`text-[10px] px-1.5 py-0.5 border ${callStatusColor(selectedCall.status)}`}>{selectedCall.status}</Badge>
              {selectedCall.agent_name && <span className="text-xs text-muted-foreground ml-auto">{selectedCall.agent_name}</span>}
            </div>
            <div className="space-y-3">
              {selectedCall.transcript.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'assistant' ? '' : 'flex-row-reverse'}`}>
                  <div className={`max-w-[75%] p-3 rounded-lg text-sm ${
                    msg.role === 'assistant'
                      ? 'bg-teal-500/10 border border-teal-500/20 rounded-tl-sm'
                      : 'bg-blue-500/10 border border-blue-500/20 rounded-tr-sm'
                  }`}>
                    <p className={`text-[10px] font-semibold mb-1 ${msg.role === 'assistant' ? 'text-teal-400' : 'text-blue-400'}`}>
                      {msg.role === 'assistant' ? '🤖 Lexa' : '👤 Caller'}
                    </p>
                    <p className="text-foreground/80">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
            {selectedCall.recording_url && (
              <div className="mt-4 pt-3 border-t border-white/5">
                <a href={selectedCall.recording_url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-400 hover:underline flex items-center gap-1">
                  🎙️ Listen to full recording
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full py-12">
            <p className="text-sm text-muted-foreground">Select a call to view its transcript</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

// ─── Analytics Tab ──────────────────────────────────────────

function AnalyticsTab() {
  const { metrics, loading } = useLexaMetrics();
  const { calls } = useLexaCalls();

  const callsByDay = useMemo(() => {
    const map = new Map<string, number>();
    calls.forEach((c) => {
      const day = c.created_at.split('T')[0];
      map.set(day, (map.get(day) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14);
  }, [calls]);

  const maxCalls = Math.max(...callsByDay.map(([, v]) => v), 1);

  return (
    <div className="space-y-6">
      {/* Call Volume Chart */}
      <GlassCard className="p-4">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-teal-400" /> Call Volume (Last 14 Days)</h3>
        {callsByDay.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No call data to display yet.</p>
        ) : (
          <div className="flex items-end gap-1 h-[120px]">
            {callsByDay.map(([date, count]) => {
              const height = Math.max((count / maxCalls) * 100, 4);
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">{count}</span>
                  <div
                    className="w-full bg-teal-500/40 rounded-t transition-all hover:bg-teal-500/60"
                    style={{ height: `${height}%` }}
                    title={`${date}: ${count} calls`}
                  />
                  <span className="text-[8px] text-muted-foreground rotate-[-45deg] origin-top-left whitespace-nowrap">{date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Metrics Table */}
      <GlassCard className="p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-teal-400" /> Daily Metrics</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
        ) : metrics.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No metrics recorded yet. Metrics are updated by the Lexa webhook.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5 text-muted-foreground">
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-right py-2 px-2">Calls</th>
                  <th className="text-right py-2 px-2">Avg Duration</th>
                  <th className="text-right py-2 px-2">Cost</th>
                  <th className="text-right py-2 px-2">Answer Rate</th>
                  <th className="text-right py-2 px-2">😊</th>
                  <th className="text-right py-2 px-2">😐</th>
                  <th className="text-right py-2 px-2">😞</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <tr key={m.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="py-2 px-2 font-mono">{m.date}</td>
                    <td className="text-right py-2 px-2">{m.total_calls}</td>
                    <td className="text-right py-2 px-2">{formatDuration(Math.round(m.avg_duration))}</td>
                    <td className="text-right py-2 px-2">${Number(m.total_cost).toFixed(2)}</td>
                    <td className="text-right py-2 px-2">{Math.round(m.answer_rate)}%</td>
                    <td className="text-right py-2 px-2 text-emerald-400">{m.sentiment_breakdown?.positive || 0}</td>
                    <td className="text-right py-2 px-2 text-amber-400">{m.sentiment_breakdown?.neutral || 0}</td>
                    <td className="text-right py-2 px-2 text-red-400">{m.sentiment_breakdown?.negative || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

// ─── Main Lexa Component ────────────────────────────────────

export default function Lexa() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-teal-500/10">
            <Phone size={24} className="text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Lexa <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">AI Phone Employee</span>
            </h2>
            <p className="text-xs text-muted-foreground">Outbound voice calls powered by Millis AI + Telnyx</p>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="bg-secondary/30 border border-secondary/50 mb-4 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="dashboard" className="text-xs gap-1.5"><BarChart3 size={14} /> Dashboard</TabsTrigger>
          <TabsTrigger value="calls" className="text-xs gap-1.5"><PhoneCall size={14} /> Call Log</TabsTrigger>
          <TabsTrigger value="leads" className="text-xs gap-1.5"><Users size={14} /> Leads</TabsTrigger>
          <TabsTrigger value="campaigns" className="text-xs gap-1.5"><Megaphone size={14} /> Campaigns</TabsTrigger>
          <TabsTrigger value="transcripts" className="text-xs gap-1.5"><MessageSquare size={14} /> Transcripts</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs gap-1.5"><TrendingUp size={14} /> Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><DashboardTab /></TabsContent>
        <TabsContent value="calls"><CallLogTab /></TabsContent>
        <TabsContent value="leads"><LeadsTab /></TabsContent>
        <TabsContent value="campaigns"><CampaignsTab /></TabsContent>
        <TabsContent value="transcripts"><TranscriptsTab /></TabsContent>
        <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
