import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, Send, FileText, GitBranch, Megaphone, BarChart3,
  Plus, Trash2, Edit, Search, Eye, Clock, Globe, Users,
  TrendingUp, MousePointerClick, Reply, Target, MapPin,
  AlertCircle, CheckCircle, XCircle, Loader2, RefreshCw, Star,
  ChevronRight, Sparkles, ArrowLeft, Activity, Zap, Play, ExternalLink,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import GlassCard from '@/components/GlassCard';
import { useNovaTemplates, useNovaSequences, useNovaCampaigns, useNovaEmails, useNovaMetrics, useNovaProspectCampaigns, useNovaProspectLeads, useNovaOutboundJobs } from '@/hooks/useNova';
import type { NovaTemplate, NovaSequence, NovaCampaign, NovaEmail, NovaDailyMetric, NovaProspectCampaign, NovaProspectLead, NovaOutboundJob } from '@/features/nova/api';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { useNavigation } from '@/contexts/NavigationContext';

// ─── Helpers ──────────────────────────────────────────────

function emailStatusColor(status: string): string {
  const map: Record<string, string> = {
    queued: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    sending: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    sent: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    opened: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    clicked: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    replied: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    bounced: 'bg-red-500/20 text-red-400 border-red-500/30',
    complained: 'bg-red-600/20 text-red-500 border-red-600/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return map[status] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
}

function campaignStatusColor(status: string): string {
  const map: Record<string, string> = {
    draft: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    paused: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  return map[status] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];
}

// ─── Futuristic SVG Components ────────────────────────────

/** Animated radial gauge with glowing neon arc */
function RadialGauge({ value, max, label, displayValue, color, icon: Icon, sub }: {
  value: number; max: number; label: string; displayValue: string; color: string; icon: React.ElementType; sub?: string;
}) {
  const pctVal = max > 0 ? Math.min(value / max, 1) : 0;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pctVal);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative group"
    >
      <GlassCard className="!p-4 flex flex-col items-center gap-2 overflow-hidden hover:border-white/10 transition-all duration-500">
        {/* Glow backdrop */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{ background: `radial-gradient(ellipse at center, ${color}08 0%, transparent 70%)` }} />

        <div className="relative w-24 h-24">
          <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
            {/* Track */}
            <circle cx="48" cy="48" r={radius} fill="none" stroke="white" strokeOpacity="0.05" strokeWidth="5" />
            {/* Animated arc */}
            <motion.circle
              cx="48" cy="48" r={radius}
              fill="none"
              stroke={color}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
              style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
            />
            {/* Glow pulse ring */}
            <motion.circle
              cx="48" cy="48" r={radius}
              fill="none"
              stroke={color}
              strokeWidth="1"
              strokeOpacity="0.3"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              animate={{ strokeOpacity: [0.1, 0.4, 0.1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ filter: `drop-shadow(0 0 12px ${color}40)` }}
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
            <Icon size={14} style={{ color }} className="mb-0.5" />
            <span className="text-lg font-bold font-heading text-foreground leading-none">{displayValue}</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">{label}</p>
          {sub && <p className="text-[9px] text-muted-foreground/70">{sub}</p>}
        </div>
      </GlassCard>
    </motion.div>
  );
}

/** Animated horizontal neon bar for funnel stages */
function NeonFunnelBar({ label, count, pctVal, color, index }: {
  label: string; count: number; pctVal: number; color: string; index: number;
}) {
  return (
    <div className="flex items-center gap-3 group">
      <span className="text-xs text-muted-foreground w-20 shrink-0 font-mono">{label}</span>
      <div className="flex-1 h-8 bg-white/[0.03] rounded-lg overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(pctVal * 100, 3)}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: index * 0.1 }}
          className="h-full rounded-lg relative"
          style={{ background: `linear-gradient(90deg, ${color}30, ${color}80)` }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{ background: `linear-gradient(90deg, transparent 0%, ${color}20 50%, transparent 100%)` }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear', delay: index * 0.5 }}
          />
          {/* Glow edge */}
          <div className="absolute right-0 top-0 h-full w-1 rounded-r-lg"
            style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}, 0 0 4px ${color}` }} />
        </motion.div>
        {/* Grid lines */}
        {[25, 50, 75].map(p => (
          <div key={p} className="absolute top-0 h-full w-px bg-white/[0.03]" style={{ left: `${p}%` }} />
        ))}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-mono text-foreground w-10 text-right">{count}</span>
        <span className="text-[10px] font-mono w-12 text-right" style={{ color }}>{(pctVal * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
}

/** Animated activity pulse dot */
function PulseDot({ color, size = 6 }: { color: string; size?: number }) {
  return (
    <span className="relative inline-flex">
      <motion.span
        className="absolute inline-flex rounded-full opacity-50"
        style={{ width: size * 2, height: size * 2, backgroundColor: color, top: -size / 2, left: -size / 2 }}
        animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <span className="relative inline-flex rounded-full" style={{ width: size, height: size, backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
    </span>
  );
}

/** Mini sparkline SVG for inline charts */
function Sparkline({ data, color, width = 80, height = 24 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ');
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color}60)` }} />
    </svg>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────

function DashboardTab({ campaigns, emails, templates }: {
  campaigns: NovaCampaign[]; emails: NovaEmail[]; templates: NovaTemplate[];
}) {
  const totalSent = emails.filter(e => e.status !== 'queued' && e.status !== 'failed').length;
  const totalOpened = emails.filter(e => e.open_count > 0).length;
  const totalClicked = emails.filter(e => e.click_count > 0).length;
  const totalReplied = emails.filter(e => e.status === 'replied').length;
  const totalBounced = emails.filter(e => e.status === 'bounced').length;
  const totalDelivered = emails.filter(e => ['delivered','opened','clicked','replied'].includes(e.status)).length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  const openRate = totalSent > 0 ? totalOpened / totalSent : 0;
  const clickRate = totalSent > 0 ? totalClicked / totalSent : 0;
  const replyRate = totalSent > 0 ? totalReplied / totalSent : 0;
  const bounceRate = totalSent > 0 ? totalBounced / totalSent : 0;
  const deliveryRate = totalSent > 0 ? totalDelivered / totalSent : 0;

  // Compute a simple daily sparkline from emails
  const dailyCounts = useMemo(() => {
    const map = new Map<string, number>();
    emails.forEach(e => {
      if (e.sent_at) {
        const day = e.sent_at.slice(0, 10);
        map.set(day, (map.get(day) || 0) + 1);
      }
    });
    const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return sorted.map(([, count]) => count);
  }, [emails]);

  return (
    <div className="space-y-6">
      {/* Radial Gauge KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <RadialGauge label="Emails Sent" displayValue={String(totalSent)} value={totalSent} max={Math.max(totalSent, 50)} icon={Send} color="#14b8a6" />
        <RadialGauge label="Open Rate" displayValue={pct(openRate)} value={openRate * 100} max={100} icon={Eye} color="#a78bfa" sub={`${totalOpened} opened`} />
        <RadialGauge label="Click Rate" displayValue={pct(clickRate)} value={clickRate * 100} max={100} icon={MousePointerClick} color="#fbbf24" sub={`${totalClicked} clicked`} />
        <RadialGauge label="Reply Rate" displayValue={pct(replyRate)} value={replyRate * 100} max={100} icon={Reply} color="#f472b6" sub={`${totalReplied} replied`} />
        <RadialGauge label="Bounce Rate" displayValue={pct(bounceRate)} value={bounceRate * 100} max={100} icon={AlertCircle} color="#ef4444" sub={`${totalBounced} bounced`} />
        <RadialGauge label="Active Campaigns" displayValue={String(activeCampaigns)} value={activeCampaigns} max={Math.max(campaigns.length, 5)} icon={Megaphone} color="#60a5fa" />
      </div>

      {/* Engagement Funnel — Neon Bars */}
      <GlassCard className="!p-5 relative overflow-hidden">
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        <div className="flex items-center gap-2 mb-5 relative">
          <Activity size={14} className="text-pink-400" />
          <h3 className="text-sm font-semibold text-foreground font-heading">Engagement Funnel</h3>
          <div className="ml-auto flex items-center gap-1.5">
            <PulseDot color="#14b8a6" />
            <span className="text-[10px] text-muted-foreground font-mono">Live</span>
          </div>
        </div>
        <div className="space-y-3 relative">
          {[
            { label: 'Sent', count: totalSent, color: '#14b8a6', pct: 1 },
            { label: 'Delivered', count: totalDelivered, color: '#60a5fa', pct: deliveryRate },
            { label: 'Opened', count: totalOpened, color: '#a78bfa', pct: openRate },
            { label: 'Clicked', count: totalClicked, color: '#fbbf24', pct: clickRate },
            { label: 'Replied', count: totalReplied, color: '#f472b6', pct: replyRate },
          ].map((row, i) => (
            <NeonFunnelBar key={row.label} label={row.label} count={row.count} pctVal={row.pct} color={row.color} index={i} />
          ))}
        </div>
      </GlassCard>

      {/* Recent Activity + Top Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="!p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-teal-400" />
            <h3 className="text-sm font-semibold text-foreground font-heading">Recent Emails</h3>
            {dailyCounts.length >= 2 && (
              <div className="ml-auto"><Sparkline data={dailyCounts} color="#14b8a6" /></div>
            )}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {emails.slice(0, 8).map((email, i) => (
              <motion.div
                key={email.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 group"
              >
                <Badge variant="outline" className={`text-[10px] ${emailStatusColor(email.status)}`}>{email.status}</Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground truncate">{email.to_name || email.to_address}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{email.subject}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {email.open_count > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-violet-400">
                      <Eye size={9} /> {email.open_count}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {email.sent_at ? formatDistanceToNow(parseISO(email.sent_at), { addSuffix: true }) : 'queued'}
                  </span>
                </div>
              </motion.div>
            ))}
            {emails.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No emails yet</p>}
          </div>
        </GlassCard>

        <GlassCard className="!p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={14} className="text-pink-400" />
            <h3 className="text-sm font-semibold text-foreground font-heading">Top Templates</h3>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {templates.filter(t => t.is_active).sort((a, b) => b.usage_count - a.usage_count).slice(0, 6).map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `linear-gradient(135deg, ${['#14b8a6','#a78bfa','#f472b6','#60a5fa','#fbbf24','#ef4444'][i % 6]}15, transparent)` }}>
                  <FileText size={12} className="text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground truncate">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.usage_count} sent · {pct(t.avg_open_rate)} open</p>
                </div>
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">{t.category}</Badge>
              </motion.div>
            ))}
            {templates.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No templates yet</p>}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ─── Outbox Tab ───────────────────────────────────────────

function OutboxTab({ emails, refetch }: { emails: NovaEmail[]; refetch: () => void }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    let list = emails;
    if (statusFilter !== 'all') list = list.filter(e => e.status === statusFilter);
    if (search) list = list.filter(e =>
      e.to_address.toLowerCase().includes(search.toLowerCase()) ||
      (e.to_name || '').toLowerCase().includes(search.toLowerCase()) ||
      e.subject.toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [emails, statusFilter, search]);

  const statuses = ['all', 'queued', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed'];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search emails..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-secondary/30 border-secondary/50" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-mono transition-colors ${
                statusFilter === s ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-muted-foreground hover:text-foreground'
              }`}
            >{s}</button>
          ))}
        </div>
        <button onClick={refetch} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Email List */}
      <GlassCard className="!p-0 overflow-hidden">
        <div className="divide-y divide-white/5">
          {filtered.map(email => (
            <div key={email.id} className="px-4 py-3 hover:bg-white/[0.03] transition-colors">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={`text-[10px] shrink-0 ${emailStatusColor(email.status)}`}>{email.status}</Badge>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground truncate">{email.to_name || email.to_address}</span>
                    {email.to_name && <span className="text-[10px] text-muted-foreground truncate">&lt;{email.to_address}&gt;</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{email.subject}</p>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  {email.open_count > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-violet-400">
                      <Eye size={10} /> {email.open_count}
                    </div>
                  )}
                  {email.click_count > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-400">
                      <MousePointerClick size={10} /> {email.click_count}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                  {email.sent_at ? format(parseISO(email.sent_at), 'MMM d, HH:mm') : '—'}
                </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-xs text-muted-foreground">No emails match your criteria</div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Templates Tab ────────────────────────────────────────

function TemplatesTab({ templates, add, edit, remove, refetch }: {
  templates: NovaTemplate[];
  add: (input: any) => Promise<NovaTemplate>;
  edit: (id: string, patch: any) => Promise<NovaTemplate>;
  remove: (id: string) => Promise<void>;
  refetch: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', subject: '', body_html: '', body_text: '', category: 'outreach', tags: '' });

  const resetForm = () => { setForm({ name: '', subject: '', body_html: '', body_text: '', category: 'outreach', tags: '' }); setEditingId(null); };

  const openEdit = (t: NovaTemplate) => {
    setForm({ name: t.name, subject: t.subject, body_html: t.body_html, body_text: t.body_text, category: t.category, tags: t.tags.join(', ') });
    setEditingId(t.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const vars = extractVariables(form.subject + ' ' + form.body_html);
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (editingId) {
      await edit(editingId, { ...form, variables: vars, tags });
    } else {
      await add({ ...form, variables: vars, tags });
    }
    setDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-mono">{templates.length} templates</p>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs hover:bg-primary/25 transition-colors">
              <Plus size={14} /> New Template
            </button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-white/10 max-w-lg">
            <DialogHeader><DialogTitle className="text-sm">{editingId ? 'Edit' : 'New'} Template</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1 h-8 text-xs bg-secondary/30 border-secondary/50" /></div>
              <div><Label className="text-xs">Subject</Label><Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Quick question about {{company}}" className="mt-1 h-8 text-xs bg-secondary/30 border-secondary/50" /></div>
              <div><Label className="text-xs">Body (HTML)</Label><Textarea value={form.body_html} onChange={e => setForm(p => ({ ...p, body_html: e.target.value }))} placeholder="<p>Hi {{name}},</p>" rows={6} className="mt-1 text-xs bg-secondary/30 border-secondary/50 font-mono" /></div>
              <div><Label className="text-xs">Plain Text Fallback</Label><Textarea value={form.body_text} onChange={e => setForm(p => ({ ...p, body_text: e.target.value }))} rows={3} className="mt-1 text-xs bg-secondary/30 border-secondary/50" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Category</Label><Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="mt-1 h-8 text-xs bg-secondary/30 border-secondary/50" /></div>
                <div><Label className="text-xs">Tags (comma-separated)</Label><Input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} className="mt-1 h-8 text-xs bg-secondary/30 border-secondary/50" /></div>
              </div>
              {/* Variable preview */}
              {(form.subject + form.body_html).includes('{{') && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-muted-foreground">Variables:</span>
                  {extractVariables(form.subject + ' ' + form.body_html).map(v => (
                    <span key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">{`{{${v}}}`}</span>
                  ))}
                </div>
              )}
              <button onClick={handleSave} disabled={!form.name || !form.subject}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors">
                {editingId ? 'Update' : 'Create'} Template
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {templates.map(t => (
          <GlassCard key={t.id} className="!p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-foreground truncate">{t.name}</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{t.subject}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button onClick={() => openEdit(t)} className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"><Edit size={12} /></button>
                <button onClick={() => remove(t.id)} className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">{t.category}</Badge>
              {t.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-[10px] bg-white/5 text-muted-foreground border-white/10">{tag}</Badge>
              ))}
            </div>
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
              <span>{t.usage_count} sent</span>
              <span className="flex items-center gap-0.5"><Eye size={10} /> {pct(t.avg_open_rate)}</span>
              <span className="flex items-center gap-0.5"><Reply size={10} /> {pct(t.avg_reply_rate)}</span>
            </div>
            {t.variables.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {t.variables.map(v => (
                  <span key={v} className="text-[9px] px-1 py-0.5 rounded bg-violet-500/10 text-violet-400 font-mono">{`{{${v}}}`}</span>
                ))}
              </div>
            )}
          </GlassCard>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full py-12 text-center text-xs text-muted-foreground">
            No templates yet — create your first one to get started.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sequences Tab ────────────────────────────────────────

function SequencesTab({ sequences, templates, add, edit, remove }: {
  sequences: NovaSequence[]; templates: NovaTemplate[];
  add: (input: any) => Promise<NovaSequence>;
  edit: (id: string, patch: any) => Promise<NovaSequence>;
  remove: (id: string) => Promise<void>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const handleCreate = async () => {
    await add({ name: form.name, description: form.description, steps: [] });
    setDialogOpen(false);
    setForm({ name: '', description: '' });
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case 'active': return <CheckCircle size={12} className="text-emerald-400" />;
      case 'paused': return <Clock size={12} className="text-amber-400" />;
      case 'archived': return <XCircle size={12} className="text-zinc-400" />;
      default: return <FileText size={12} className="text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-mono">{sequences.length} sequences</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs hover:bg-primary/25 transition-colors">
              <Plus size={14} /> New Sequence
            </button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-white/10 max-w-md">
            <DialogHeader><DialogTitle className="text-sm">New Sequence</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="3-Touch Enterprise Outreach" className="mt-1 h-8 text-xs bg-secondary/30 border-secondary/50" /></div>
              <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="mt-1 text-xs bg-secondary/30 border-secondary/50" /></div>
              <button onClick={handleCreate} disabled={!form.name}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors">
                Create Sequence
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {sequences.map(seq => (
          <GlassCard key={seq.id} className="!p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-pink-500/10 shrink-0">
                <GitBranch size={16} className="text-pink-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {statusIcon(seq.status)}
                  <h4 className="text-sm font-semibold text-foreground">{seq.name}</h4>
                  <Badge variant="outline" className={`text-[10px] ${campaignStatusColor(seq.status)}`}>{seq.status}</Badge>
                </div>
                {seq.description && <p className="text-[10px] text-muted-foreground mt-1">{seq.description}</p>}
                <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground font-mono">
                  <span>{(seq.steps || []).length} steps</span>
                  <span>{seq.total_enrolled} enrolled</span>
                  <span>{seq.active_count} active</span>
                  <span>{seq.completed_count} completed</span>
                </div>
                {/* Step flow visualization */}
                {(seq.steps || []).length > 0 && (
                  <div className="flex items-center gap-1.5 mt-3 overflow-x-auto">
                    {(seq.steps as any[]).map((step, i) => {
                      const tmpl = templates.find(t => t.id === step.template_id);
                      return (
                        <div key={i} className="flex items-center gap-1.5 shrink-0">
                          {i > 0 && <ChevronRight size={10} className="text-muted-foreground/30" />}
                          <div className="px-2 py-1 rounded bg-white/5 text-[10px] font-mono text-muted-foreground">
                            {step.delay_days > 0 && <span className="text-amber-400 mr-1">+{step.delay_days}d</span>}
                            {tmpl ? tmpl.name : `Step ${step.step}`}
                            {step.condition !== 'none' && <span className="text-pink-400 ml-1">if {step.condition}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => remove(seq.id)} className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
              </div>
            </div>
          </GlassCard>
        ))}
        {sequences.length === 0 && (
          <div className="py-12 text-center text-xs text-muted-foreground">No sequences yet — sequences let you build multi-step email flows.</div>
        )}
      </div>
    </div>
  );
}

// ─── Campaigns Tab ────────────────────────────────────────

function CampaignsTab({ campaigns, sequences, templates, add, edit }: {
  campaigns: NovaCampaign[]; sequences: NovaSequence[]; templates: NovaTemplate[];
  add: (input: any) => Promise<NovaCampaign>;
  edit: (id: string, patch: any) => Promise<NovaCampaign>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', from_address: 'Manik Kanasani <mani@updates.verticalaisystems.com>', sequence_id: '', template_id: '', send_limit_per_day: 50 });

  const handleCreate = async () => {
    await add({
      name: form.name,
      from_address: form.from_address,
      sequence_id: form.sequence_id || undefined,
      template_id: form.template_id || undefined,
      send_limit_per_day: form.send_limit_per_day,
    });
    setDialogOpen(false);
    setForm({ name: '', from_address: 'Manik Kanasani <mani@updates.verticalaisystems.com>', sequence_id: '', template_id: '', send_limit_per_day: 50 });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-mono">{campaigns.length} campaigns</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs hover:bg-primary/25 transition-colors">
              <Plus size={14} /> New Campaign
            </button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-white/10 max-w-md">
            <DialogHeader><DialogTitle className="text-sm">New Campaign</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Campaign Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Q1 Enterprise Push" className="mt-1 h-8 text-xs bg-secondary/30 border-secondary/50" /></div>
              <div><Label className="text-xs">From Address</Label><Input value={form.from_address} onChange={e => setForm(p => ({ ...p, from_address: e.target.value }))} placeholder="Manik Kanasani <mani@updates.verticalaisystems.com>" className="mt-1 h-8 text-xs bg-secondary/30 border-secondary/50" /></div>
              <div>
                <Label className="text-xs">Sequence</Label>
                <select value={form.sequence_id} onChange={e => setForm(p => ({ ...p, sequence_id: e.target.value }))}
                  className="mt-1 w-full h-8 text-xs bg-secondary/30 border border-secondary/50 rounded-md px-2 text-foreground">
                  <option value="">— none —</option>
                  {sequences.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Template (for single-send campaigns)</Label>
                <select value={form.template_id} onChange={e => setForm(p => ({ ...p, template_id: e.target.value }))}
                  className="mt-1 w-full h-8 text-xs bg-secondary/30 border border-secondary/50 rounded-md px-2 text-foreground">
                  <option value="">— none —</option>
                  {templates.filter(t => t.is_active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div><Label className="text-xs">Daily Send Limit</Label><Input type="number" value={form.send_limit_per_day} onChange={e => setForm(p => ({ ...p, send_limit_per_day: Number(e.target.value) }))} className="mt-1 h-8 text-xs bg-secondary/30 border-secondary/50" /></div>
              <button onClick={handleCreate} disabled={!form.name || !form.from_address}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors">
                Create Campaign
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {campaigns.map(c => {
          const progress = c.total_leads > 0 ? c.emails_sent / c.total_leads : 0;
          return (
            <GlassCard key={c.id} className="!p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">{c.name}</h4>
                    <Badge variant="outline" className={`text-[10px] ${campaignStatusColor(c.status)}`}>{c.status}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{c.from_address}</p>
                </div>
                <div className="flex gap-1">
                  {c.status === 'draft' && (
                    <button onClick={() => edit(c.id, { status: 'active' })} className="px-2 py-1 rounded text-[10px] bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors">Activate</button>
                  )}
                  {c.status === 'active' && (
                    <button onClick={() => edit(c.id, { status: 'paused' })} className="px-2 py-1 rounded text-[10px] bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors">Pause</button>
                  )}
                  {c.status === 'paused' && (
                    <button onClick={() => edit(c.id, { status: 'active' })} className="px-2 py-1 rounded text-[10px] bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors">Resume</button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1 font-mono">
                  <span>{c.emails_sent} / {c.total_leads} sent</span>
                  <span>{(progress * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Open', value: pct(c.open_rate), color: 'text-violet-400' },
                  { label: 'Click', value: pct(c.click_rate), color: 'text-amber-400' },
                  { label: 'Reply', value: pct(c.reply_rate), color: 'text-pink-400' },
                  { label: 'Bounce', value: c.emails_bounced, color: 'text-red-400' },
                ].map(stat => (
                  <div key={stat.label} className="text-center">
                    <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-[9px] text-muted-foreground font-mono">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
                <span>Limit: {c.send_limit_per_day}/day</span>
                <span>Window: {c.send_window_start}–{c.send_window_end}</span>
                <span>{c.timezone}</span>
              </div>
            </GlassCard>
          );
        })}
        {campaigns.length === 0 && (
          <div className="col-span-full py-12 text-center text-xs text-muted-foreground">No campaigns yet — create one to start sending.</div>
        )}
      </div>
    </div>
  );
}

// ─── SVG Area Chart with Glow ─────────────────────────────

function GlowAreaChart({ data, width = 600, height = 160 }: {
  data: { label: string; value: number }[];
  width?: number; height?: number;
}) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const padding = { top: 10, right: 10, bottom: 28, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padding.top + chartH - (d.value / max) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
        </linearGradient>
        <filter id="glowLine">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Horizontal grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={padding.left} x2={padding.left + chartW}
          y1={padding.top + chartH * (1 - f)} y2={padding.top + chartH * (1 - f)}
          stroke="white" strokeOpacity="0.04" strokeDasharray="4 4" />
      ))}
      {/* Area fill */}
      <motion.path d={areaPath} fill="url(#areaGrad)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
      {/* Glow line */}
      <motion.path d={linePath} fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        filter="url(#glowLine)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />
      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          <motion.circle cx={p.x} cy={p.y} r="3" fill="#14b8a6" stroke="#0d1117" strokeWidth="1.5"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 + i * 0.05 }}
            style={{ filter: 'drop-shadow(0 0 4px #14b8a680)' }} />
          {/* Label */}
          <text x={p.x} y={padding.top + chartH + 16} textAnchor="middle" fontSize="8" fill="#666" fontFamily="monospace">
            {data[i].label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** Multi-line engagement chart */
function EngagementLineChart({ data, width = 600, height = 180 }: {
  data: { label: string; open: number; click: number; reply: number }[];
  width?: number; height?: number;
}) {
  if (data.length === 0) return null;
  const allVals = data.flatMap(d => [d.open, d.click, d.reply]);
  const max = Math.max(...allVals, 0.1);
  const padding = { top: 10, right: 10, bottom: 28, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const toPath = (key: 'open' | 'click' | 'reply') =>
    data.map((d, i) => {
      const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartW;
      const y = padding.top + chartH - (d[key] / max) * chartH;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

  const lines = [
    { key: 'open' as const, color: '#a78bfa', label: 'Open' },
    { key: 'click' as const, color: '#fbbf24', label: 'Click' },
    { key: 'reply' as const, color: '#f472b6', label: 'Reply' },
  ];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        {lines.map(l => (
          <filter key={l.key} id={`glow-${l.key}`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        ))}
      </defs>
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={padding.left} x2={padding.left + chartW}
          y1={padding.top + chartH * (1 - f)} y2={padding.top + chartH * (1 - f)}
          stroke="white" strokeOpacity="0.04" strokeDasharray="4 4" />
      ))}
      {/* Lines */}
      {lines.map((l, li) => (
        <motion.path key={l.key} d={toPath(l.key)} fill="none" stroke={l.color} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" filter={`url(#glow-${l.key})`}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: li * 0.2 }}
        />
      ))}
      {/* X labels */}
      {data.map((d, i) => (
        <text key={i} x={padding.left + (i / Math.max(data.length - 1, 1)) * chartW} y={padding.top + chartH + 16}
          textAnchor="middle" fontSize="8" fill="#666" fontFamily="monospace">{d.label}</text>
      ))}
    </svg>
  );
}

/** Large radial ring for analytics summary */
function AnalyticsRing({ label, value, displayValue, color, icon: Icon }: {
  label: string; value: number; displayValue: string; color: string; icon: React.ElementType;
}) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(value / 100, 1));

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="white" strokeOpacity="0.04" strokeWidth="6" />
          <motion.circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
          />
          {/* Outer glow ring */}
          <motion.circle cx="60" cy="60" r="56" fill="none" stroke={color} strokeWidth="0.5"
            strokeOpacity="0.2" strokeDasharray="4 6"
            animate={{ strokeDashoffset: [0, -40] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon size={16} style={{ color }} className="mb-1" />
          <span className="text-xl font-bold font-heading text-foreground">{displayValue}</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">{label}</span>
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────

function AnalyticsTab({ emails, metrics }: { emails: NovaEmail[]; metrics: NovaDailyMetric[] }) {
  const sorted = [...metrics].sort((a, b) => a.date.localeCompare(b.date));
  const totalSent = emails.filter(e => e.status !== 'queued' && e.status !== 'failed').length;
  const totalOpened = emails.filter(e => e.open_count > 0).length;
  const totalClicked = emails.filter(e => e.click_count > 0).length;
  const totalReplied = emails.filter(e => e.status === 'replied').length;
  const avgOpenRate = totalSent > 0 ? totalOpened / totalSent : 0;
  const avgClickRate = totalSent > 0 ? totalClicked / totalSent : 0;
  const avgReplyRate = totalSent > 0 ? totalReplied / totalSent : 0;

  // Prepare chart data
  const last14 = sorted.slice(-14);
  const volumeData = last14.map(d => ({ label: format(parseISO(d.date), 'M/d'), value: d.emails_sent }));
  const engagementData = last14.map(d => ({
    label: format(parseISO(d.date), 'M/d'),
    open: d.open_rate * 100,
    click: d.click_rate * 100,
    reply: d.reply_rate * 100,
  }));

  // Status breakdown for donut
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    emails.forEach(e => { counts[e.status] = (counts[e.status] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [emails]);

  const statusColors: Record<string, string> = {
    queued: '#71717a', sent: '#14b8a6', delivered: '#60a5fa', opened: '#a78bfa',
    clicked: '#fbbf24', replied: '#f472b6', bounced: '#ef4444', failed: '#dc2626', complained: '#991b1b',
  };

  return (
    <div className="space-y-6">
      {/* Summary Rings */}
      <GlassCard className="!p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="flex items-center gap-2 mb-6 relative">
          <BarChart3 size={14} className="text-teal-400" />
          <h3 className="text-sm font-semibold text-foreground font-heading">Performance Overview</h3>
          <span className="text-[10px] text-muted-foreground font-mono ml-auto">{totalSent} emails analyzed</span>
        </div>
        <div className="flex justify-center gap-8 flex-wrap relative">
          <AnalyticsRing label="Total Sent" value={Math.min(totalSent, 100)} displayValue={String(totalSent)} color="#14b8a6" icon={Send} />
          <AnalyticsRing label="Open Rate" value={avgOpenRate * 100} displayValue={pct(avgOpenRate)} color="#a78bfa" icon={Eye} />
          <AnalyticsRing label="Click Rate" value={avgClickRate * 100} displayValue={pct(avgClickRate)} color="#fbbf24" icon={MousePointerClick} />
          <AnalyticsRing label="Reply Rate" value={avgReplyRate * 100} displayValue={pct(avgReplyRate)} color="#f472b6" icon={Reply} />
        </div>
      </GlassCard>

      {/* Volume Chart */}
      <GlassCard className="!p-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="flex items-center gap-2 mb-4 relative">
          <Activity size={14} className="text-teal-400" />
          <h3 className="text-sm font-semibold text-foreground font-heading">Daily Email Volume</h3>
          <div className="ml-auto flex items-center gap-1.5">
            <PulseDot color="#14b8a6" />
            <span className="text-[10px] text-muted-foreground font-mono">Last 14 days</span>
          </div>
        </div>
        {volumeData.length > 0 ? (
          <div className="relative"><GlowAreaChart data={volumeData} /></div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-8">No daily metrics recorded yet</p>
        )}
      </GlassCard>

      {/* Engagement Lines + Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="!p-5 lg:col-span-2 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-violet-400" />
            <h3 className="text-sm font-semibold text-foreground font-heading">Engagement Trends</h3>
          </div>
          {engagementData.length > 0 ? (
            <div className="relative"><EngagementLineChart data={engagementData} /></div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">Not enough data yet</p>
          )}
          <div className="flex items-center gap-5 mt-3 pt-3 border-t border-white/5">
            {[
              { label: 'Open Rate', color: '#a78bfa' },
              { label: 'Click Rate', color: '#fbbf24' },
              { label: 'Reply Rate', color: '#f472b6' },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color, boxShadow: `0 0 4px ${l.color}` }} />
                {l.label}
              </span>
            ))}
          </div>
        </GlassCard>

        {/* Status Breakdown */}
        <GlassCard className="!p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} className="text-pink-400" />
            <h3 className="text-sm font-semibold text-foreground font-heading">Status Breakdown</h3>
          </div>
          {statusCounts.length > 0 ? (
            <div className="space-y-2.5">
              {statusCounts.map(([status, count], i) => {
                const pctVal = emails.length > 0 ? count / emails.length : 0;
                const color = statusColors[status] || '#71717a';
                return (
                  <motion.div key={status} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }} className="flex items-center gap-2">
                    <PulseDot color={color} size={5} />
                    <span className="text-[10px] text-muted-foreground font-mono w-16 capitalize">{status}</span>
                    <div className="flex-1 h-3 bg-white/[0.03] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${color}40, ${color})` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(pctVal * 100, 4)}%` }}
                        transition={{ duration: 0.8, delay: i * 0.08 }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-foreground w-6 text-right">{count}</span>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">No data yet</p>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

// ─── Prospecting Tab ──────────────────────────────────────

// ─── Outbound Pipeline Tab ────────────────────────────────

function outboundStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    researched: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    research_failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    review: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    sent: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    send_failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    replied: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    followup: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };
  return map[status] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
}

function jobStatusColor(status: string): string {
  const map: Record<string, string> = {
    created: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    researching: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    researched: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    drafting: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    drafted: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    review: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    sending: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    paused: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  };
  return map[status] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
}

function PipelineBar({ job }: { job: NovaOutboundJob }) {
  const total = job.total_leads || 1;
  const stages = [
    { label: 'Researched', count: job.researched, color: '#3b82f6' },
    { label: 'Drafted', count: job.drafted, color: '#f59e0b' },
    { label: 'Approved', count: job.approved, color: '#10b981' },
    { label: 'Sent', count: job.sent, color: '#8b5cf6' },
    { label: 'Replied', count: job.replied, color: '#ec4899' },
  ];

  return (
    <div className="space-y-1.5">
      <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-white/[0.03]">
        {stages.map(s => (
          <motion.div
            key={s.label}
            initial={{ width: 0 }}
            animate={{ width: `${(s.count / total) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ backgroundColor: s.color }}
            className="h-full first:rounded-l-full last:rounded-r-full"
          />
        ))}
      </div>
      <div className="flex gap-3 text-[10px] font-mono text-muted-foreground">
        {stages.map(s => (
          <span key={s.label} className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}: {s.count}
          </span>
        ))}
      </div>
    </div>
  );
}

function OutboundTab({
  outboundJobs, prospectCampaigns, campaigns, templates,
  createJob, getJob, research, draft, send,
  approve, reject, approveAll, reviewQueue, runPipeline,
  refetchJobs,
}: {
  outboundJobs: NovaOutboundJob[];
  prospectCampaigns: NovaProspectCampaign[];
  campaigns: NovaCampaign[];
  templates: NovaTemplate[];
  createJob: (input: any) => Promise<any>;
  getJob: (id: string) => Promise<any>;
  research: (jobId: string, batchSize?: number) => Promise<any>;
  draft: (jobId: string, batchSize?: number) => Promise<any>;
  send: (jobId: string, batchSize?: number) => Promise<any>;
  approve: (leadId: string) => Promise<any>;
  reject: (leadId: string, reason?: string) => Promise<any>;
  approveAll: (jobId: string) => Promise<any>;
  reviewQueue: (jobId: string, limit?: number) => Promise<any>;
  runPipeline: (jobId: string, batchSize?: number) => Promise<any>;
  refetchJobs: () => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ prospect_campaign_id: '', template_id: '', auto_approve_threshold: 0.7 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [jobDetail, setJobDetail] = useState<{ job: NovaOutboundJob; lead_counts: Record<string, number> } | null>(null);
  const [reviewLeads, setReviewLeads] = useState<NovaProspectLead[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'jobs' | 'review'>('jobs');
  const [actionResult, setActionResult] = useState<string | null>(null);

  const loadJobDetail = async (jobId: string) => {
    try {
      const result = await getJob(jobId);
      setJobDetail(result);
    } catch (err: any) {
      console.error('Failed to load job detail', err);
    }
  };

  const loadReview = async (jobId: string) => {
    setReviewLoading(true);
    try {
      const result = await reviewQueue(jobId, 50);
      setReviewLeads(result.leads);
    } catch (err: any) {
      console.error('Failed to load review queue', err);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSelectJob = async (jobId: string) => {
    setSelectedJob(jobId);
    await loadJobDetail(jobId);
  };

  const handleCreate = async () => {
    if (!form.prospect_campaign_id) return;
    setActionLoading('create');
    try {
      const result = await createJob({
        prospect_campaign_id: form.prospect_campaign_id,
        template_id: form.template_id || undefined,
        config: { auto_approve_threshold: form.auto_approve_threshold },
      });
      setCreateOpen(false);
      setForm({ prospect_campaign_id: '', template_id: '', auto_approve_threshold: 0.7 });
      setActionResult(`Job created with ${result.job.total_leads} leads`);
      setTimeout(() => setActionResult(null), 4000);
    } catch (err: any) {
      alert('Failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = async (action: string, jobId: string) => {
    setActionLoading(action);
    try {
      let result: any;
      switch (action) {
        case 'research': result = await research(jobId); break;
        case 'draft': result = await draft(jobId); break;
        case 'send': result = await send(jobId); break;
        case 'approveAll': result = await approveAll(jobId); break;
        case 'pipeline': result = await runPipeline(jobId); break;
      }
      await loadJobDetail(jobId);
      const msg = result?.researched != null ? `Researched ${result.researched} leads`
        : result?.drafted != null ? `Drafted ${result.drafted} emails`
        : result?.sent_count != null ? `Sent ${result.sent_count} emails`
        : result?.approved_count != null ? `Approved ${result.approved_count} leads`
        : result?.stages ? `Pipeline: ${Object.values(result.stages).map((s: any) => `${s.action} ${s.processed}`).join(', ')}`
        : 'Done';
      setActionResult(msg);
      setTimeout(() => setActionResult(null), 4000);
    } catch (err: any) {
      alert('Action failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (leadId: string) => {
    try {
      await approve(leadId);
      setReviewLeads(prev => prev.filter(l => l.id !== leadId));
      if (selectedJob) loadJobDetail(selectedJob);
    } catch (err: any) {
      alert('Approve failed: ' + err.message);
    }
  };

  const handleReject = async (leadId: string) => {
    try {
      await reject(leadId);
      setReviewLeads(prev => prev.filter(l => l.id !== leadId));
      if (selectedJob) loadJobDetail(selectedJob);
    } catch (err: any) {
      alert('Reject failed: ' + err.message);
    }
  };

  // KPIs
  const totalJobs = outboundJobs.length;
  const totalSent = outboundJobs.reduce((s, j) => s + j.sent, 0);
  const totalReplied = outboundJobs.reduce((s, j) => s + j.replied, 0);
  const pendingReview = outboundJobs.reduce((s, j) => s + Math.max(0, j.drafted - j.approved - j.sent), 0);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <RadialGauge label="Active Jobs" displayValue={String(totalJobs)} value={totalJobs} max={Math.max(totalJobs, 5)} icon={Zap} color="#f97316" />
        <RadialGauge label="Emails Sent" displayValue={String(totalSent)} value={totalSent} max={Math.max(totalSent, 50)} icon={Send} color="#8b5cf6" />
        <RadialGauge label="Replies" displayValue={String(totalReplied)} value={totalReplied} max={Math.max(totalSent, 1)} icon={Reply} color="#ec4899" sub={totalSent > 0 ? `${((totalReplied / totalSent) * 100).toFixed(1)}% rate` : undefined} />
        <RadialGauge label="In Review" displayValue={String(pendingReview)} value={pendingReview} max={Math.max(pendingReview, 10)} icon={Eye} color="#f59e0b" sub={pendingReview > 0 ? 'Needs approval' : 'All clear'} />
      </div>

      {/* View Toggle + Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-white/[0.03] rounded-lg p-0.5">
          <button onClick={() => setViewMode('jobs')}
            className={`px-3 py-1.5 rounded-md text-xs transition-colors ${viewMode === 'jobs' ? 'bg-orange-500/20 text-orange-400' : 'text-muted-foreground hover:text-foreground'}`}>
            <Zap size={12} className="inline mr-1" /> Pipeline Jobs
          </button>
          <button onClick={() => { setViewMode('review'); if (selectedJob) loadReview(selectedJob); }}
            className={`px-3 py-1.5 rounded-md text-xs transition-colors ${viewMode === 'review' ? 'bg-orange-500/20 text-orange-400' : 'text-muted-foreground hover:text-foreground'}`}>
            <Eye size={12} className="inline mr-1" /> Review Queue
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {actionResult && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle size={12} className="text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-mono">{actionResult}</span>
            </motion.div>
          )}

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/15 text-orange-400 text-xs hover:bg-orange-500/25 transition-colors">
                <Plus size={14} /> New Outbound Job
              </button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-white/10 max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-sm flex items-center gap-2">
                  <Zap size={16} className="text-orange-400" />
                  Create Outbound Pipeline Job
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Prospect Campaign *</Label>
                  <select value={form.prospect_campaign_id} onChange={e => setForm(f => ({ ...f, prospect_campaign_id: e.target.value }))}
                    className="w-full mt-1 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground">
                    <option value="">Select a prospect campaign...</option>
                    {prospectCampaigns.filter(c => c.status === 'completed').map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.total_leads || 0} leads)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email Template (optional)</Label>
                  <select value={form.template_id} onChange={e => setForm(f => ({ ...f, template_id: e.target.value }))}
                    className="w-full mt-1 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground">
                    <option value="">AI will generate from scratch</option>
                    {templates.filter(t => t.is_active).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Auto-approve threshold (QA score)</Label>
                  <Input type="number" min={0} max={1} step={0.05} value={form.auto_approve_threshold}
                    onChange={e => setForm(f => ({ ...f, auto_approve_threshold: parseFloat(e.target.value) || 0.7 }))}
                    className="mt-1 bg-white/[0.03] border-white/10 text-xs" placeholder="0.7" />
                  <p className="text-[10px] text-muted-foreground mt-1">Drafts scoring above this go straight to approved. Below goes to manual review.</p>
                </div>
                <button onClick={handleCreate} disabled={!form.prospect_campaign_id || actionLoading === 'create'}
                  className="w-full py-2 rounded-lg bg-orange-500/20 text-orange-400 text-xs hover:bg-orange-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {actionLoading === 'create' ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                  Create Pipeline Job
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Jobs View */}
      {viewMode === 'jobs' && (
        <div className="space-y-3">
          {outboundJobs.length === 0 ? (
            <GlassCard className="!p-8 text-center">
              <Zap size={32} className="mx-auto text-orange-500/30 mb-3" />
              <p className="text-sm text-muted-foreground">No outbound pipeline jobs yet</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Create a job to start researching, drafting, and sending personalized cold emails</p>
            </GlassCard>
          ) : (
            outboundJobs.map(job => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`cursor-pointer transition-all ${selectedJob === job.id ? 'ring-1 ring-orange-500/30' : ''}`}
                onClick={() => handleSelectJob(job.id)}>
                <GlassCard className="!p-4 hover:border-white/10 transition-all">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium truncate">{job.nova_prospect_campaigns?.name || 'Unnamed'}</span>
                        <Badge className={`text-[9px] px-1.5 py-0 ${jobStatusColor(job.status)}`}>{job.status}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
                        <span>{job.total_leads} leads</span>
                        {job.nova_campaigns?.name && <span>→ {job.nova_campaigns.name}</span>}
                        <span>{formatDistanceToNow(parseISO(job.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {selectedJob === job.id && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={e => { e.stopPropagation(); handleAction('research', job.id); }}
                          disabled={!!actionLoading} title="Research batch"
                          className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[10px] disabled:opacity-50">
                          {actionLoading === 'research' ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleAction('draft', job.id); }}
                          disabled={!!actionLoading} title="Draft batch"
                          className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-[10px] disabled:opacity-50">
                          {actionLoading === 'draft' ? <Loader2 size={12} className="animate-spin" /> : <Edit size={12} />}
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleAction('send', job.id); }}
                          disabled={!!actionLoading} title="Send batch"
                          className="p-1.5 rounded-md bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 text-[10px] disabled:opacity-50">
                          {actionLoading === 'send' ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleAction('pipeline', job.id); }}
                          disabled={!!actionLoading} title="Run full pipeline"
                          className="p-1.5 rounded-md bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 text-[10px] disabled:opacity-50">
                          {actionLoading === 'pipeline' ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Pipeline progress bar */}
                  <PipelineBar job={job} />

                  {/* Expanded detail for selected job */}
                  {selectedJob === job.id && jobDetail && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 pt-3 border-t border-white/5">
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {Object.entries(jobDetail.lead_counts || {}).map(([status, count]) => (
                          <div key={status} className="text-center">
                            <div className="text-lg font-bold font-mono">{count as number}</div>
                            <div className="text-[9px] text-muted-foreground capitalize">{status.replace('_', ' ')}</div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => { setViewMode('review'); loadReview(job.id); }}
                          className="flex-1 py-1.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] hover:bg-amber-500/20 flex items-center justify-center gap-1">
                          <Eye size={10} /> Review Queue
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleAction('approveAll', job.id); }}
                          disabled={!!actionLoading}
                          className="flex-1 py-1.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] hover:bg-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-1">
                          {actionLoading === 'approveAll' ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle size={10} />}
                          Approve All
                        </button>
                      </div>
                    </motion.div>
                  )}
                </GlassCard>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Review Queue View */}
      {viewMode === 'review' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setViewMode('jobs')} className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground">
              <ArrowLeft size={14} />
            </button>
            <h3 className="text-sm font-medium">Review Queue</h3>
            {selectedJob && (
              <button onClick={() => loadReview(selectedJob)} className="ml-auto p-1.5 rounded-md hover:bg-white/10 text-muted-foreground">
                <RefreshCw size={12} />
              </button>
            )}
          </div>

          {reviewLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : reviewLeads.length === 0 ? (
            <GlassCard className="!p-8 text-center">
              <CheckCircle size={32} className="mx-auto text-emerald-500/30 mb-3" />
              <p className="text-sm text-muted-foreground">Review queue is empty</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">All drafts have been approved or no drafts need review</p>
            </GlassCard>
          ) : (
            reviewLeads.map(lead => (
              <motion.div key={lead.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard className="!p-4 hover:border-white/10 transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="text-sm font-medium">{lead.business_name}</div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono mt-0.5">
                        {lead.email && <span>{lead.email}</span>}
                        {lead.website && <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-0.5"><ExternalLink size={9} /> website</a>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {lead.qa_score != null && (
                        <Badge className={`text-[9px] px-1.5 py-0 ${lead.qa_score >= 0.7 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : lead.qa_score >= 0.4 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                          QA: {(lead.qa_score * 100).toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Research brief */}
                  {lead.research_data && (
                    <div className="mb-2 p-2 rounded-lg bg-white/[0.02] border border-white/5 text-[10px] space-y-1">
                      {lead.research_data.personalization_opener && (
                        <p><span className="text-blue-400">Opener:</span> {lead.research_data.personalization_opener}</p>
                      )}
                      {lead.research_data.observed_gap && (
                        <p><span className="text-amber-400">Gap:</span> {lead.research_data.observed_gap}</p>
                      )}
                      {lead.research_data.offer_angle && (
                        <p><span className="text-emerald-400">Angle:</span> {lead.research_data.offer_angle}</p>
                      )}
                    </div>
                  )}

                  {/* Draft preview */}
                  {lead.draft_subject && (
                    <div className="mb-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                      <div className="text-[10px] text-muted-foreground mb-1">Subject:</div>
                      <div className="text-xs font-medium mb-2">{lead.draft_subject}</div>
                      <div className="text-[10px] text-muted-foreground mb-1">Body:</div>
                      <div className="text-[10px] leading-relaxed text-foreground/80 max-h-32 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: lead.draft_body_html || '' }} />
                    </div>
                  )}

                  {/* Approve / Reject */}
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(lead.id)}
                      className="flex-1 py-1.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] hover:bg-emerald-500/20 flex items-center justify-center gap-1">
                      <CheckCircle size={10} /> Approve
                    </button>
                    <button onClick={() => handleReject(lead.id)}
                      className="flex-1 py-1.5 rounded-md bg-red-500/10 text-red-400 text-[10px] hover:bg-red-500/20 flex items-center justify-center gap-1">
                      <XCircle size={10} /> Reject
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ProspectingTab({ prospectCampaigns, prospectLeads, createCampaign, runCampaign, previewQuery, editLead, removeLead, refetchCampaigns, refetchLeads }: {
  prospectCampaigns: NovaProspectCampaign[];
  prospectLeads: NovaProspectLead[];
  createCampaign: (input: { name: string; query: string; description?: string; max_results?: number }) => Promise<any>;
  runCampaign: (id: string) => Promise<any>;
  previewQuery: (query: string) => Promise<any>;
  editLead: (id: string, patch: any) => Promise<any>;
  removeLead: (id: string) => Promise<void>;
  refetchCampaigns: () => void;
  refetchLeads: () => void;
}) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<'input' | 'preview' | 'running'>('input');
  const [form, setForm] = useState({ name: '', query: '', description: '', max_results: 50 });
  const [previewData, setPreviewData] = useState<{ searchTerms: string[]; location: string; maxResults: number } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [runLoading, setRunLoading] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<{ total_found: number; imported: number } | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'campaigns' | 'leads'>('campaigns');

  const filteredLeads = useMemo(() => {
    let list = prospectLeads;
    if (selectedCampaign) list = list.filter(l => l.campaign_id === selectedCampaign);
    if (leadStatusFilter !== 'all') list = list.filter(l => l.status === leadStatusFilter);
    if (leadSearch) list = list.filter(l =>
      (l.business_name || '').toLowerCase().includes(leadSearch.toLowerCase()) ||
      (l.email || '').toLowerCase().includes(leadSearch.toLowerCase()) ||
      (l.category || '').toLowerCase().includes(leadSearch.toLowerCase()) ||
      (l.city || '').toLowerCase().includes(leadSearch.toLowerCase())
    );
    return list;
  }, [prospectLeads, selectedCampaign, leadStatusFilter, leadSearch]);

  const handlePreview = async () => {
    if (!form.query) return;
    setPreviewLoading(true);
    try {
      const result = await previewQuery(form.query);
      setPreviewData(result.structured_query);
      setWizardStep('preview');
    } catch (err: any) {
      alert('Query conversion failed: ' + err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const result = await createCampaign({
        name: form.name || `Prospect ${new Date().toLocaleDateString()}`,
        query: form.query,
        description: form.description || undefined,
        max_results: form.max_results,
      });
      setWizardOpen(false);
      setWizardStep('input');
      setForm({ name: '', query: '', description: '', max_results: 50 });
      setPreviewData(null);
    } catch (err: any) {
      alert('Campaign creation failed: ' + err.message);
    }
  };

  const handleRun = async (campaignId: string) => {
    setRunLoading(campaignId);
    setRunResult(null);
    try {
      const result = await runCampaign(campaignId);
      setRunResult({ total_found: result.total_found, imported: result.imported });
      refetchLeads();
    } catch (err: any) {
      alert('Scraping failed: ' + err.message);
    } finally {
      setRunLoading(null);
    }
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    searching: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const leadStatusColors: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    contacted: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    qualified: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    converted: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    dnc: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  // KPIs for leads
  const totalLeads = prospectLeads.length;
  const withEmail = prospectLeads.filter(l => l.email).length;
  const withPhone = prospectLeads.filter(l => l.phone).length;
  const categories = [...new Set(prospectLeads.map(l => l.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <RadialGauge label="Total Leads" displayValue={String(totalLeads)} value={totalLeads} max={Math.max(totalLeads, 100)} icon={Users} color="#14b8a6" />
        <RadialGauge label="With Email" displayValue={String(withEmail)} value={withEmail} max={Math.max(totalLeads, 1)} icon={Mail} color="#a78bfa" sub={totalLeads > 0 ? `${((withEmail / totalLeads) * 100).toFixed(0)}% coverage` : undefined} />
        <RadialGauge label="With Phone" displayValue={String(withPhone)} value={withPhone} max={Math.max(totalLeads, 1)} icon={Globe} color="#fbbf24" sub={totalLeads > 0 ? `${((withPhone / totalLeads) * 100).toFixed(0)}% coverage` : undefined} />
        <RadialGauge label="Campaigns" displayValue={String(prospectCampaigns.length)} value={prospectCampaigns.length} max={Math.max(prospectCampaigns.length, 5)} icon={Target} color="#f472b6" sub={`${prospectCampaigns.filter(c => c.status === 'completed').length} completed`} />
      </div>

      {/* View Toggle + Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-white/[0.03] rounded-lg p-0.5">
          <button onClick={() => setViewMode('campaigns')}
            className={`px-3 py-1.5 rounded-md text-xs transition-colors ${viewMode === 'campaigns' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <Target size={12} className="inline mr-1" /> Campaigns
          </button>
          <button onClick={() => setViewMode('leads')}
            className={`px-3 py-1.5 rounded-md text-xs transition-colors ${viewMode === 'leads' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <Users size={12} className="inline mr-1" /> Leads ({totalLeads})
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {runResult && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle size={12} className="text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-mono">Found {runResult.total_found} · Imported {runResult.imported}</span>
            </motion.div>
          )}

          <Dialog open={wizardOpen} onOpenChange={(o) => { setWizardOpen(o); if (!o) { setWizardStep('input'); setPreviewData(null); } }}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs hover:bg-primary/25 transition-colors">
                <Plus size={14} /> New Prospect Campaign
              </button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-white/10 max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-sm flex items-center gap-2">
                  <Target size={16} className="text-teal-400" />
                  {wizardStep === 'input' ? 'Describe Your Target Market' : wizardStep === 'preview' ? 'Review Search Strategy' : 'Searching...'}
                </DialogTitle>
              </DialogHeader>

              {wizardStep === 'input' && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Campaign Name</Label>
                    <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g., Miami Law Firms Q1" className="mt-1 h-8 text-xs bg-secondary/30 border-secondary/50" />
                  </div>
                  <div>
                    <Label className="text-xs">Who are you targeting? (Natural Language)</Label>
                    <Textarea value={form.query} onChange={e => setForm(p => ({ ...p, query: e.target.value }))}
                      placeholder="e.g., Personal injury law firms in Miami, FL with at least 4-star ratings. Also include family lawyers and estate planning attorneys in the greater Miami area."
                      rows={4} className="mt-1 text-xs bg-secondary/30 border-secondary/50" />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Kimi K2.5 will convert your description into optimized Google Maps search queries.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Max Results</Label>
                      <Input type="number" value={form.max_results} onChange={e => setForm(p => ({ ...p, max_results: Number(e.target.value) }))}
                        className="mt-1 h-8 text-xs bg-secondary/30 border-secondary/50" />
                    </div>
                    <div>
                      <Label className="text-xs">Description (optional)</Label>
                      <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                        placeholder="Internal notes" className="mt-1 h-8 text-xs bg-secondary/30 border-secondary/50" />
                    </div>
                  </div>
                  <button onClick={handlePreview} disabled={!form.query || previewLoading}
                    className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    {previewLoading ? <><Loader2 size={14} className="animate-spin" /> Analyzing with Kimi K2.5...</> : <><Sparkles size={14} /> Preview Search Strategy</>}
                  </button>
                </div>
              )}

              {wizardStep === 'preview' && previewData && (
                <div className="space-y-4">
                  <GlassCard className="!p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={12} className="text-teal-400" />
                      <span className="text-xs font-semibold text-foreground">Location</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{previewData.location}</p>
                  </GlassCard>
                  <GlassCard className="!p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Search size={12} className="text-violet-400" />
                      <span className="text-xs font-semibold text-foreground">Search Queries ({previewData.searchTerms.length})</span>
                    </div>
                    <div className="space-y-1">
                      {previewData.searchTerms.map((term, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ChevronRight size={10} className="text-teal-400 shrink-0" />
                          <span>{term}</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                  <div className="text-[10px] text-muted-foreground font-mono text-center">
                    Up to {previewData.maxResults} results · Powered by Apify Google Maps Scraper
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setWizardStep('input')}
                      className="flex-1 py-2 rounded-lg bg-white/5 text-foreground text-xs hover:bg-white/10 transition-colors">
                      ← Edit Query
                    </button>
                    <button onClick={handleCreate}
                      className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1">
                      <CheckCircle size={14} /> Create Campaign
                    </button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Campaigns View */}
      {viewMode === 'campaigns' && (
        <div className="space-y-3">
          {prospectCampaigns.map(c => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard className="!p-4 hover:border-white/10 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-teal-500/10 shrink-0">
                    <Target size={16} className="text-teal-400" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-foreground">{c.name}</h4>
                      <Badge variant="outline" className={`text-[10px] ${statusColors[c.status] || statusColors.draft}`}>{c.status}</Badge>
                      {c.status === 'searching' && <Loader2 size={12} className="animate-spin text-blue-400" />}
                    </div>

                    {c.description && <p className="text-[10px] text-muted-foreground">{c.description}</p>}

                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                      <Search size={10} />
                      <span className="truncate max-w-md">"{c.search_query}"</span>
                    </div>

                    {c.structured_query && (
                      <div className="flex flex-wrap gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 text-[9px] font-mono">
                          <MapPin size={8} className="inline mr-0.5" /> {(c.structured_query as any).location}
                        </span>
                        {((c.structured_query as any).searchTerms || []).slice(0, 3).map((t: string, i: number) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground text-[9px] font-mono">{t}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
                      <span>{c.total_leads_found} found</span>
                      <span>{c.leads_imported} imported</span>
                      <span>{formatDistanceToNow(parseISO(c.created_at), { addSuffix: true })}</span>
                    </div>

                    {c.error_message && (
                      <p className="text-[10px] text-red-400 bg-red-500/10 px-2 py-1 rounded">{c.error_message}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {c.status === 'draft' && (
                      <button onClick={() => handleRun(c.id)} disabled={runLoading === c.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-500/15 text-teal-400 text-[10px] hover:bg-teal-500/25 transition-colors disabled:opacity-40">
                        {runLoading === c.id ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                        {runLoading === c.id ? 'Scraping...' : 'Run'}
                      </button>
                    )}
                    {c.status === 'completed' && c.leads_imported > 0 && (
                      <button onClick={() => { setSelectedCampaign(c.id); setViewMode('leads'); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-500/15 text-violet-400 text-[10px] hover:bg-violet-500/25 transition-colors">
                        <Users size={12} /> View Leads
                      </button>
                    )}
                    {c.status === 'failed' && (
                      <button onClick={() => handleRun(c.id)} disabled={runLoading === c.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 text-[10px] hover:bg-amber-500/25 transition-colors">
                        <RefreshCw size={12} /> Retry
                      </button>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
          {prospectCampaigns.length === 0 && (
            <GlassCard className="!p-8 text-center">
              <Target size={32} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">No prospect campaigns yet</p>
              <p className="text-[10px] text-muted-foreground/60">Describe your target market in natural language and let AI find leads for you.</p>
            </GlassCard>
          )}
        </div>
      )}

      {/* Leads View */}
      {viewMode === 'leads' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {selectedCampaign && (
              <button onClick={() => setSelectedCampaign(null)}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-teal-500/10 text-teal-400 text-[10px] hover:bg-teal-500/20 transition-colors">
                <XCircle size={10} /> Clear filter
              </button>
            )}
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search leads by name, email, category, city..." value={leadSearch} onChange={e => setLeadSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-secondary/30 border-secondary/50" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {['all', 'new', 'contacted', 'qualified', 'converted', 'dnc'].map(s => (
                <button key={s} onClick={() => setLeadStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-mono transition-colors ${
                    leadStatusFilter === s ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-muted-foreground hover:text-foreground'
                  }`}>{s}</button>
              ))}
            </div>
            <button onClick={refetchLeads} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Category chips */}
          {categories.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {categories.slice(0, 10).map(cat => {
                const count = filteredLeads.filter(l => l.category === cat).length;
                return (
                  <span key={cat} className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-muted-foreground font-mono">
                    {cat} ({count})
                  </span>
                );
              })}
            </div>
          )}

          {/* Leads Table */}
          <GlassCard className="!p-0 overflow-hidden">
            <div className="divide-y divide-white/5">
              {filteredLeads.slice(0, 100).map(lead => (
                <div key={lead.id} className="px-4 py-3 hover:bg-white/[0.03] transition-colors group">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${leadStatusColors[lead.status] || leadStatusColors.new}`}>{lead.status}</Badge>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground truncate">{lead.business_name}</span>
                        {lead.rating && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                            <Star size={9} /> {lead.rating}
                          </span>
                        )}
                        {lead.category && (
                          <Badge variant="outline" className="text-[9px] bg-white/5 text-muted-foreground border-white/10">{lead.category}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                        {lead.email && <span className="flex items-center gap-0.5"><Mail size={9} /> {lead.email}</span>}
                        {lead.phone && <span className="flex items-center gap-0.5"><Globe size={9} /> {lead.phone}</span>}
                        {lead.city && <span className="flex items-center gap-0.5"><MapPin size={9} /> {lead.city}{lead.state ? `, ${lead.state}` : ''}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {lead.website && (
                        <a href={lead.website} target="_blank" rel="noopener noreferrer"
                          className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
                          <ExternalLink size={11} />
                        </a>
                      )}
                      <select
                        value={lead.status}
                        onChange={e => editLead(lead.id, { status: e.target.value })}
                        className="h-6 text-[10px] bg-secondary/30 border border-secondary/50 rounded px-1 text-foreground"
                      >
                        {['new', 'contacted', 'qualified', 'converted', 'dnc'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button onClick={() => removeLead(lead.id)}
                        className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredLeads.length === 0 && (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  {prospectLeads.length === 0 ? 'No leads yet — run a prospect campaign to find leads.' : 'No leads match your filters.'}
                </div>
              )}
              {filteredLeads.length > 100 && (
                <div className="py-2 text-center text-[10px] text-muted-foreground font-mono">
                  Showing 100 of {filteredLeads.length} leads
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

// ─── Main Nova Component ──────────────────────────────────

const Nova = () => {
  const { navigateTo } = useNavigation();
  const { templates, loading: tLoad, refetch: refetchTemplates, add: addTemplate, edit: editTemplate, remove: removeTemplate } = useNovaTemplates();
  const { sequences, loading: sLoad, refetch: refetchSequences, add: addSequence, edit: editSequence, remove: removeSequence } = useNovaSequences();
  const { campaigns, loading: cLoad, refetch: refetchCampaigns, add: addCampaign, edit: editCampaign } = useNovaCampaigns();
  const { emails, loading: eLoad, refetch: refetchEmails, send: sendEmail } = useNovaEmails();
  const { metrics, loading: mLoad, refetch: refetchMetrics } = useNovaMetrics();
  const { campaigns: pCampaigns, loading: pLoad, refetch: refetchPCampaigns, create: createPCampaign, run: runPCampaign, preview: previewPQuery } = useNovaProspectCampaigns();
  const { leads: pLeads, loading: plLoad, refetch: refetchPLeads, edit: editPLead, remove: removePLead } = useNovaProspectLeads();
  const {
    jobs: outboundJobs, loading: oLoad, refetch: refetchOutbound,
    create: createOutbound, getJob: getOutbound, research: researchOutbound,
    draft: draftOutbound, send: sendOutbound, approve: approveOutbound,
    reject: rejectOutbound, approveAll: approveAllOutbound,
    reviewQueue: reviewQueueOutbound, runPipeline: runOutboundPipeline,
  } = useNovaOutboundJobs();

  const loading = tLoad || sLoad || cLoad || eLoad;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigateTo('ops')} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div className="p-2 rounded-xl bg-pink-500/15">
            <Mail size={20} className="text-pink-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-foreground">Nova — AI Email Employee</h2>
            <p className="text-xs text-muted-foreground font-mono">Personalized sequences · Engagement tracking · Campaign management</p>
          </div>
          {loading && <Loader2 size={16} className="animate-spin text-muted-foreground ml-auto" />}
        </div>
      </motion.div>

      <div className="h-px bg-gradient-to-r from-transparent via-pink-500/20 to-transparent" />

      {/* Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="bg-secondary/30 border border-white/5 p-1 h-auto flex-wrap">
          <TabsTrigger value="dashboard" className="text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary gap-1.5"><Sparkles size={12} /> Dashboard</TabsTrigger>
          <TabsTrigger value="outbox" className="text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary gap-1.5"><Send size={12} /> Outbox</TabsTrigger>
          <TabsTrigger value="templates" className="text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary gap-1.5"><FileText size={12} /> Templates</TabsTrigger>
          <TabsTrigger value="sequences" className="text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary gap-1.5"><GitBranch size={12} /> Sequences</TabsTrigger>
          <TabsTrigger value="campaigns" className="text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary gap-1.5"><Megaphone size={12} /> Campaigns</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary gap-1.5"><BarChart3 size={12} /> Analytics</TabsTrigger>
          <TabsTrigger value="prospecting" className="text-xs data-[state=active]:bg-teal-400/15 data-[state=active]:text-teal-400 gap-1.5"><Target size={12} /> Prospecting</TabsTrigger>
          <TabsTrigger value="outbound" className="text-xs data-[state=active]:bg-orange-400/15 data-[state=active]:text-orange-400 gap-1.5"><Zap size={12} /> Outbound</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardTab campaigns={campaigns} emails={emails} templates={templates} />
        </TabsContent>
        <TabsContent value="outbox">
          <OutboxTab emails={emails} refetch={refetchEmails} />
        </TabsContent>
        <TabsContent value="templates">
          <TemplatesTab templates={templates} add={addTemplate} edit={editTemplate} remove={removeTemplate} refetch={refetchTemplates} />
        </TabsContent>
        <TabsContent value="sequences">
          <SequencesTab sequences={sequences} templates={templates} add={addSequence} edit={editSequence} remove={removeSequence} />
        </TabsContent>
        <TabsContent value="campaigns">
          <CampaignsTab campaigns={campaigns} sequences={sequences} templates={templates} add={addCampaign} edit={editCampaign} />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsTab emails={emails} metrics={metrics} />
        </TabsContent>
        <TabsContent value="prospecting">
          <ProspectingTab
            prospectCampaigns={pCampaigns}
            prospectLeads={pLeads}
            createCampaign={createPCampaign}
            runCampaign={runPCampaign}
            previewQuery={previewPQuery}
            editLead={editPLead}
            removeLead={removePLead}
            refetchCampaigns={refetchPCampaigns}
            refetchLeads={refetchPLeads}
          />
        </TabsContent>
        <TabsContent value="outbound">
          <OutboundTab
            outboundJobs={outboundJobs}
            prospectCampaigns={pCampaigns}
            campaigns={campaigns}
            templates={templates}
            createJob={createOutbound}
            getJob={getOutbound}
            research={researchOutbound}
            draft={draftOutbound}
            send={sendOutbound}
            approve={approveOutbound}
            reject={rejectOutbound}
            approveAll={approveAllOutbound}
            reviewQueue={reviewQueueOutbound}
            runPipeline={runOutboundPipeline}
            refetchJobs={refetchOutbound}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Nova;
