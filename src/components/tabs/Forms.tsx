import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, Eye, Copy, ExternalLink, Phone, Mail,
  BarChart3, Clock, Settings, Trash2, Play, Pause, ToggleLeft, ToggleRight,
  ChevronRight, Zap, ArrowRight, CheckCircle2, AlertCircle, Globe, Link2
} from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import TypeformViewer from '@/components/TypeformViewer';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const WEBHOOK_SECRET = import.meta.env.VITE_AGENT_COMMAND_WEBHOOK_SECRET || '';

interface FormField {
  id: string;
  type: 'welcome' | 'text' | 'email' | 'phone' | 'company' | 'select' | 'textarea' | 'thankyou';
  label: string;
  placeholder?: string;
  required?: boolean;
  description?: string;
  options?: string[];
  buttonText?: string;
}

interface LeadForm {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  fields: FormField[];
  settings: Record<string, unknown>;
  lead_magnet_title: string | null;
  lead_magnet_description: string | null;
  lead_magnet_url: string | null;
  auto_call_enabled: boolean;
  call_prompt: string | null;
  call_first_message: string | null;
  call_delay_seconds: number;
  theme: { accent: string; background: string; style: string };
  total_submissions: number;
  total_calls_triggered: number;
  created_at: string;
  updated_at: string;
}

interface Submission {
  id: string;
  form_id: string;
  data: Record<string, unknown>;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  call_triggered: boolean;
  call_session_id: string | null;
  created_at: string;
}

// ── Default Lead Magnet Form Template ──
const defaultLeadMagnetFields: FormField[] = [
  {
    id: 'welcome',
    type: 'welcome',
    label: 'Get Your Free AI Agent Blueprint',
    description: 'Discover how top agencies are using AI agents to 10x their output. Get the complete playbook — free.',
    buttonText: 'Get My Free Blueprint →',
  },
  {
    id: 'name',
    type: 'text',
    label: "What's your name?",
    placeholder: 'Type your full name...',
    required: true,
  },
  {
    id: 'email',
    type: 'email',
    label: "What's your email?",
    description: "We'll send the blueprint here.",
    placeholder: 'you@company.com',
    required: true,
  },
  {
    id: 'phone',
    type: 'phone',
    label: "What's your phone number?",
    description: "Optional — we'll call you with a personalized walkthrough.",
    placeholder: '+1 (555) 000-0000',
    required: false,
  },
  {
    id: 'company',
    type: 'company',
    label: "What's your company name?",
    placeholder: 'Your company...',
    required: false,
  },
  {
    id: 'role',
    type: 'select',
    label: 'What best describes your role?',
    options: ['Founder / CEO', 'Agency Owner', 'Marketing Lead', 'Developer', 'Freelancer', 'Other'],
    required: true,
  },
  {
    id: 'thankyou',
    type: 'thankyou',
    label: "You're in! 🎉",
    description: 'Check your email for the AI Agent Blueprint. Our AI agent Lexa will call you shortly with a personalized walkthrough.',
    buttonText: 'Download Blueprint',
  },
];

// ── API helpers ──
async function apiFetch(action: string, body: Record<string, unknown> = {}) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/lexa-forms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': WEBHOOK_SECRET,
    },
    body: JSON.stringify({ action, ...body }),
  });
  return res.json();
}

// ── Status badge ──
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    draft: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    paused: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    archived: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  };
  return (
    <Badge variant="outline" className={`text-[10px] font-mono uppercase ${styles[status] || styles.draft}`}>
      {status}
    </Badge>
  );
}

// ── Main Forms Component ──
const Forms = () => {
  const [forms, setForms] = useState<LeadForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<LeadForm | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [view, setView] = useState<'list' | 'detail' | 'preview'>('list');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Load forms
  useEffect(() => {
    loadForms();
  }, []);

  async function loadForms() {
    setLoading(true);
    try {
      const data = await apiFetch('list_forms');
      if (data.success) setForms(data.forms || []);
    } catch (e) {
      console.error('Failed to load forms:', e);
    }
    setLoading(false);
  }

  async function loadSubmissions(formId: string) {
    try {
      const data = await apiFetch('list_submissions', { form_id: formId });
      if (data.success) setSubmissions(data.submissions || []);
    } catch (e) {
      console.error('Failed to load submissions:', e);
    }
  }

  async function createDefaultForm() {
    setCreating(true);
    try {
      const data = await apiFetch('create_form', {
        name: 'AI Agent Blueprint — Lead Magnet',
        slug: 'ai-blueprint',
        description: 'Capture leads with a free AI Agent Blueprint in exchange for contact info. Auto-calls with Lexa.',
        fields: defaultLeadMagnetFields,
        lead_magnet_title: 'The AI Agent Blueprint',
        lead_magnet_description: 'Complete playbook for building AI-powered agencies',
        lead_magnet_url: 'https://agentcommandhub.com/blueprint',
        auto_call_enabled: true,
        call_prompt: 'You are Lexa, a friendly AI assistant from Agent Command Hub. You are calling a lead who just downloaded the AI Agent Blueprint. Thank them, ask what part interested them most, and offer to walk them through the Pro Plan ($49/mo). Use send_email if they want more details sent over.',
        call_first_message: "Hey! This is Lexa from Agent Command Hub. I saw you just grabbed the AI Agent Blueprint — awesome choice! I wanted to personally welcome you and see if you have any questions.",
        call_delay_seconds: 30,
        theme: { accent: '#14b8a6', background: '#0a0f1a', style: 'glass' },
      });
      if (data.success) {
        toast.success('Lead magnet form created!');
        await loadForms();
      } else {
        toast.error(data.error || 'Failed to create form');
      }
    } catch (e) {
      toast.error('Failed to create form');
    }
    setCreating(false);
  }

  async function toggleFormStatus(form: LeadForm) {
    const newStatus = form.status === 'active' ? 'paused' : 'active';
    try {
      const data = await apiFetch('update_form', { form_id: form.id, status: newStatus });
      if (data.success) {
        toast.success(`Form ${newStatus === 'active' ? 'activated' : 'paused'}`);
        await loadForms();
        if (selectedForm?.id === form.id) {
          setSelectedForm({ ...form, status: newStatus });
        }
      }
    } catch (e) {
      toast.error('Failed to update form');
    }
  }

  async function toggleAutoCall(form: LeadForm) {
    try {
      const data = await apiFetch('update_form', {
        form_id: form.id,
        auto_call_enabled: !form.auto_call_enabled,
      });
      if (data.success) {
        toast.success(`Auto-call ${!form.auto_call_enabled ? 'enabled' : 'disabled'}`);
        await loadForms();
        if (selectedForm?.id === form.id) {
          setSelectedForm({ ...form, auto_call_enabled: !form.auto_call_enabled });
        }
      }
    } catch (e) {
      toast.error('Failed to update auto-call');
    }
  }

  function selectForm(form: LeadForm) {
    setSelectedForm(form);
    setView('detail');
    loadSubmissions(form.id);
  }

  function getPublicUrl(slug: string) {
    return `${SUPABASE_URL}/functions/v1/lexa-form-public?slug=${slug}`;
  }

  function copyLink(slug: string) {
    navigator.clipboard.writeText(`${window.location.origin}/form/${slug}`);
    toast.success('Form link copied!');
  }

  // ── LIST VIEW ──
  if (view === 'list') {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h2 className="text-2xl font-bold font-heading text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                <FileText size={20} className="text-violet-400" />
              </div>
              Forms
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Premium lead capture forms with auto-call triggers
            </p>
          </div>
          <Button
            onClick={createDefaultForm}
            disabled={creating}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Plus size={16} />
            {creating ? 'Creating...' : 'New Lead Magnet Form'}
          </Button>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Total Forms', value: forms.length, icon: FileText, color: 'violet' },
            { label: 'Active', value: forms.filter(f => f.status === 'active').length, icon: Play, color: 'emerald' },
            { label: 'Total Submissions', value: forms.reduce((a, f) => a + f.total_submissions, 0), icon: BarChart3, color: 'blue' },
            { label: 'Calls Triggered', value: forms.reduce((a, f) => a + f.total_calls_triggered, 0), icon: Phone, color: 'teal' },
          ].map((stat, i) => (
            <GlassCard key={stat.label} hover className="!p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono uppercase text-muted-foreground/60">{stat.label}</p>
                  <p className="text-2xl font-bold font-heading mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/15 flex items-center justify-center`}>
                  <stat.icon size={18} className={`text-${stat.color}-400`} />
                </div>
              </div>
            </GlassCard>
          ))}
        </motion.div>

        {/* Forms Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <GlassCard key={i} className="!p-6 animate-pulse">
                <div className="h-4 bg-white/5 rounded w-3/4 mb-3" />
                <div className="h-3 bg-white/5 rounded w-1/2 mb-6" />
                <div className="h-3 bg-white/5 rounded w-full" />
              </GlassCard>
            ))}
          </div>
        ) : forms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="!p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                <FileText size={28} className="text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold font-heading mb-2">No forms yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first lead capture form. Visitors fill it out, and Lexa automatically calls them.
              </p>
              <Button
                onClick={createDefaultForm}
                disabled={creating}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                <Zap size={16} />
                {creating ? 'Creating...' : 'Create Lead Magnet Form'}
              </Button>
            </GlassCard>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {forms.map((form, i) => (
              <motion.div
                key={form.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <GlassCard
                  hover
                  glow
                  className="!p-0 cursor-pointer overflow-hidden group"
                  onClick={() => selectForm(form)}
                >
                  {/* Card top accent */}
                  <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${form.theme?.accent || '#14b8a6'}, transparent)` }} />

                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold font-heading truncate">{form.name}</h3>
                          <StatusBadge status={form.status} />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{form.description}</p>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-1" />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <BarChart3 size={12} />
                        {form.total_submissions} submissions
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Phone size={12} />
                        {form.total_calls_triggered} calls
                      </span>
                      {form.auto_call_enabled && (
                        <span className="flex items-center gap-1.5 text-teal-400">
                          <Zap size={12} />
                          Auto-call
                        </span>
                      )}
                    </div>

                    {/* Actions bar */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedForm(form);
                          setView('preview');
                        }}
                      >
                        <Eye size={12} className="mr-1" /> Preview
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyLink(form.slug);
                        }}
                      >
                        <Link2 size={12} className="mr-1" /> Copy Link
                      </Button>
                      <div className="flex-1" />
                      <span className="text-[10px] text-muted-foreground/40 font-mono">
                        /{form.slug}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── PREVIEW VIEW ──
  if (view === 'preview' && selectedForm) {
    return (
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('list')}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back
          </Button>
          <h2 className="text-lg font-semibold font-heading">Preview: {selectedForm.name}</h2>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyLink(selectedForm.slug)}
            className="gap-1"
          >
            <Link2 size={14} /> Copy Public Link
          </Button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl overflow-hidden border border-white/5"
          style={{ height: 'calc(100vh - 200px)' }}
        >
          <TypeformViewer
            fields={selectedForm.fields}
            theme={selectedForm.theme}
            formName={selectedForm.name}
            onSubmit={async (data) => {
              try {
                toast.loading('Submitting...', { id: 'form-submit' });
                const res = await fetch(
                  `${SUPABASE_URL}/functions/v1/lexa-form-public?slug=${selectedForm.slug}`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data }),
                  }
                );
                const result = await res.json();
                if (result.success) {
                  toast.success(
                    result.call_triggered
                      ? 'Submitted! Auto-call will trigger shortly.'
                      : 'Submitted successfully!',
                    { id: 'form-submit' }
                  );
                  // Refresh form data
                  loadForms();
                } else {
                  toast.error(result.error || 'Submission failed', { id: 'form-submit' });
                }
              } catch (err) {
                toast.error('Failed to submit form', { id: 'form-submit' });
                console.error('Form submit error:', err);
              }
            }}
          />
        </motion.div>
      </div>
    );
  }

  // ── DETAIL VIEW ──
  if (view === 'detail' && selectedForm) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setView('list'); setSelectedForm(null); }}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-heading truncate">{selectedForm.name}</h2>
              <StatusBadge status={selectedForm.status} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView('preview')}
              className="gap-1"
            >
              <Eye size={14} /> Preview
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyLink(selectedForm.slug)}
              className="gap-1"
            >
              <Link2 size={14} /> Copy Link
            </Button>
            <Button
              size="sm"
              onClick={() => toggleFormStatus(selectedForm)}
              className={selectedForm.status === 'active'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
              }
            >
              {selectedForm.status === 'active' ? <><Pause size={14} className="mr-1" /> Pause</> : <><Play size={14} className="mr-1" /> Activate</>}
            </Button>
          </div>
        </motion.div>

        {/* Config + Stats Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Stats */}
          <GlassCard className="!p-5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 size={14} className="text-blue-400" /> Analytics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold">{selectedForm.total_submissions}</p>
                <p className="text-[10px] text-muted-foreground font-mono uppercase">Submissions</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{selectedForm.total_calls_triggered}</p>
                <p className="text-[10px] text-muted-foreground font-mono uppercase">Calls Triggered</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {selectedForm.total_submissions > 0
                    ? Math.round((selectedForm.total_calls_triggered / selectedForm.total_submissions) * 100)
                    : 0}%
                </p>
                <p className="text-[10px] text-muted-foreground font-mono uppercase">Call Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{selectedForm.fields.filter(f => f.type !== 'welcome' && f.type !== 'thankyou').length}</p>
                <p className="text-[10px] text-muted-foreground font-mono uppercase">Fields</p>
              </div>
            </div>
          </GlassCard>

          {/* Auto-Call Config */}
          <GlassCard className="!p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Phone size={14} className="text-teal-400" /> Auto-Call
              </h3>
              <Switch
                checked={selectedForm.auto_call_enabled}
                onCheckedChange={() => toggleAutoCall(selectedForm)}
              />
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock size={12} />
                <span>Delay: {selectedForm.call_delay_seconds}s after submit</span>
              </div>
              <div className="flex items-start gap-2">
                <Zap size={12} className="mt-0.5 shrink-0" />
                <span className="line-clamp-3">{selectedForm.call_prompt ? 'Custom prompt configured' : 'Using default prompt'}</span>
              </div>
            </div>
            {selectedForm.auto_call_enabled && (
              <div className="text-[10px] text-teal-400 flex items-center gap-1">
                <CheckCircle2 size={10} /> Active — new submissions trigger calls via Lexa
              </div>
            )}
          </GlassCard>

          {/* Lead Magnet */}
          <GlassCard className="!p-5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText size={14} className="text-violet-400" /> Lead Magnet
            </h3>
            {selectedForm.lead_magnet_title ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">{selectedForm.lead_magnet_title}</p>
                <p className="text-xs text-muted-foreground">{selectedForm.lead_magnet_description}</p>
                {selectedForm.lead_magnet_url && (
                  <a
                    href={selectedForm.lead_magnet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink size={10} /> {selectedForm.lead_magnet_url}
                  </a>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No lead magnet configured</p>
            )}
          </GlassCard>
        </div>

        {/* Public URL */}
        <GlassCard className="!p-4">
          <div className="flex items-center gap-3">
            <Globe size={14} className="text-primary shrink-0" />
            <code className="text-xs font-mono text-primary/80 bg-primary/5 px-2 py-1 rounded flex-1 truncate">
              {`${window.location.origin}/form/${selectedForm.slug}`}
            </code>
            <Button variant="ghost" size="sm" onClick={() => copyLink(selectedForm.slug)} className="h-7 gap-1 shrink-0">
              <Copy size={12} /> Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 shrink-0"
              onClick={() => window.open(getPublicUrl(selectedForm.slug), '_blank')}
            >
              <ExternalLink size={12} /> Open
            </Button>
          </div>
        </GlassCard>

        {/* Submissions Table */}
        <GlassCard className="!p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Mail size={14} className="text-blue-400" /> Recent Submissions
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => loadSubmissions(selectedForm.id)}
            >
              Refresh
            </Button>
          </div>

          {submissions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No submissions yet. Share the form link to start collecting leads.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-teal-500/20 flex items-center justify-center text-xs font-bold">
                      {(sub.name || '?')[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{sub.name || 'Anonymous'}</span>
                        {sub.call_triggered && (
                          <Badge variant="outline" className="text-[9px] bg-teal-500/10 text-teal-400 border-teal-500/20">
                            <Phone size={8} className="mr-0.5" /> Called
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {sub.email && <span>{sub.email}</span>}
                        {sub.phone && <span>{sub.phone}</span>}
                        {sub.company && <span>{sub.company}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground/50 font-mono shrink-0">
                      {new Date(sub.created_at).toLocaleDateString()} {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </GlassCard>
      </div>
    );
  }

  return null;
};

export default Forms;
