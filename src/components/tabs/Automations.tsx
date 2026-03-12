import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Webhook,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { useWebhooks, type WebhookWithFunctions } from '@/hooks/useWebhooks';
import { useWebhookEvents, type WebhookEvent } from '@/hooks/useWebhookEvents';
import { useAutomationResults, type AutomationResult } from '@/hooks/useAutomationResults';
import { useReports, type Report } from '@/hooks/useReports';
import { formatDistanceToNow, parseISO } from 'date-fns';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// ─── Webhooks & Functions Tab ────────────────────────────────────────────────

function CreateWebhookDialog({ onCreate }: { onCreate: (name: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onCreate(name.trim());
      setName('');
      setOpen(false);
    } catch (err: any) {
      console.error('Create webhook failed:', err);
      setError(err.message || 'Failed to create webhook');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium">
          <Plus size={16} /> Create Webhook
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-white/10">
        <DialogHeader>
          <DialogTitle>Create Webhook</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {error && (
            <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}
          <div>
            <Label className="text-xs text-muted-foreground">Webhook Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fathom Meetings"
              className="mt-1 bg-secondary/30 border-secondary/50"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || saving}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddFunctionDialog({
  webhookId,
  onAdd,
}: {
  webhookId: string;
  onAdd: (input: { webhook_id: string; name: string; prompt: string; output_table?: string }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [outputTable, setOutputTable] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!name.trim() || !prompt.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onAdd({
        webhook_id: webhookId,
        name: name.trim(),
        prompt: prompt.trim(),
        output_table: outputTable.trim() || undefined,
      });
      setName('');
      setPrompt('');
      setOutputTable('');
      setOpen(false);
    } catch (err: any) {
      console.error('Add function failed:', err);
      setError(err.message || 'Failed to add function');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-primary hover:bg-primary/10 transition-colors">
          <Zap size={12} /> Add Function
        </button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-white/10">
        <DialogHeader>
          <DialogTitle>Add Processing Function</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {error && (
            <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}
          <div>
            <Label className="text-xs text-muted-foreground">Function Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Process Fathom Meeting Data"
              className="mt-1 bg-secondary/30 border-secondary/50"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Processing Instructions</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe how incoming data should be processed…"
              className="mt-1 bg-secondary/30 border-secondary/50 min-h-[100px]"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Output Table (optional)</Label>
            <Input
              value={outputTable}
              onChange={(e) => setOutputTable(e.target.value)}
              placeholder="e.g. meetings"
              className="mt-1 bg-secondary/30 border-secondary/50"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Leave empty to store results only in the Reports tab.
            </p>
          </div>
          <button
            onClick={handleAdd}
            disabled={!name.trim() || !prompt.trim() || saving}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Adding…' : 'Add Function'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
      title="Copy"
    >
      {copied ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
    </button>
  );
}

function WebhookCard({
  webhook,
  onToggle,
  onDelete,
  onDeleteFunction,
  onAddFunction,
}: {
  webhook: WebhookWithFunctions;
  onToggle: (id: string, active: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDeleteFunction: (id: string) => Promise<void>;
  onAddFunction: (input: { webhook_id: string; name: string; prompt: string; output_table?: string }) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const webhookUrl = `${SUPABASE_URL}/functions/v1/webhook-ingest?slug=${webhook.slug}`;

  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
              <Webhook size={16} className="text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-foreground truncate">{webhook.name}</h3>
              <p className="text-[10px] text-muted-foreground font-mono truncate">/{webhook.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={`text-[10px] ${webhook.functions.length > 0 ? 'border-primary/30 text-primary' : 'border-muted-foreground/30 text-muted-foreground'}`}>
              {webhook.functions.length} fn{webhook.functions.length !== 1 ? 's' : ''}
            </Badge>
            <Switch
              checked={webhook.is_active}
              onCheckedChange={(v) => onToggle(webhook.id, v)}
            />
            <button
              onClick={() => onDelete(webhook.id)}
              className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Webhook URL */}
        <div className="mt-3 flex items-center gap-2 p-2 rounded-md bg-secondary/20 border border-secondary/30">
          <code className="text-[11px] text-muted-foreground font-mono truncate flex-1">{webhookUrl}</code>
          <CopyButton text={webhookUrl} />
        </div>
      </div>

      {/* Expanded: functions list */}
      {expanded && (
        <div className="border-t border-secondary px-4 pb-4 pt-3 space-y-2">
          {webhook.functions.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No functions attached yet.</p>
          )}
          {webhook.functions.map((fn) => (
            <div key={fn.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20 border border-secondary/30">
              <Zap size={14} className="text-accent mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-foreground">{fn.name}</span>
                  <button
                    onClick={() => onDeleteFunction(fn.id)}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{fn.prompt}</p>
                {fn.output_table && (
                  <Badge variant="outline" className="mt-2 text-[10px] border-accent/30 text-accent">
                    → {fn.output_table}
                  </Badge>
                )}
              </div>
            </div>
          ))}
          <AddFunctionDialog webhookId={webhook.id} onAdd={onAddFunction} />
        </div>
      )}
    </GlassCard>
  );
}

function WebhooksTab() {
  const { webhooks, loading, createWebhook, deleteWebhook, toggleWebhook, createFunction, deleteFunction } = useWebhooks();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Your Webhooks</h3>
        <CreateWebhookDialog onCreate={createWebhook} />
      </div>

      {webhooks.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <Webhook size={32} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No webhooks yet. Create one to get started.</p>
        </GlassCard>
      ) : (
        webhooks.map((wh, i) => (
          <motion.div
            key={wh.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <WebhookCard
              webhook={wh}
              onToggle={toggleWebhook}
              onDelete={deleteWebhook}
              onDeleteFunction={deleteFunction}
              onAddFunction={createFunction}
            />
          </motion.div>
        ))
      )}
    </div>
  );
}

// ─── Webhook Queue Tab ───────────────────────────────────────────────────────

const statusConfig = {
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' },
  processing: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30' },
  completed: { icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/10 border-primary/30' },
  failed: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30' },
};

function QueueTab() {
  const { events, loading, refetch } = useWebhookEvents();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Incoming Events</h3>
        <button
          onClick={refetch}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {events.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <Clock size={32} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No webhook events received yet.</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {events.map((evt, i) => {
            const cfg = statusConfig[evt.status];
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === evt.id;

            return (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <GlassCard className="p-0 overflow-hidden">
                  <button
                    className="w-full p-3 flex items-center gap-3 text-left hover:bg-secondary/20 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : evt.id)}
                  >
                    <StatusIcon
                      size={16}
                      className={`${cfg.color} shrink-0 ${evt.status === 'processing' ? 'animate-spin' : ''}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">{evt.webhook_name}</span>
                        <Badge variant="outline" className={`text-[10px] ${cfg.bg} ${cfg.color}`}>
                          {evt.status}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatDistanceToNow(parseISO(evt.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="border-t border-secondary px-3 pb-3 pt-2">
                      {evt.error && (
                        <div className="mb-2 p-2 rounded bg-destructive/10 border border-destructive/20">
                          <p className="text-xs text-destructive font-mono">{evt.error}</p>
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Payload</p>
                      <pre className="text-[11px] text-foreground/80 font-mono bg-secondary/20 rounded p-2 overflow-auto max-h-48">
                        {JSON.stringify(evt.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Reports Tab ─────────────────────────────────────────────────────────────

function ReportViewerDialog({
  report,
  open,
  onOpenChange,
}: {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-white/10 max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {report.agent_emoji && <span>{report.agent_emoji}</span>}
            {report.title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto rounded-lg border border-white/10 bg-white">
          <iframe
            srcDoc={report.html_content}
            title={report.title}
            className="w-full min-h-[60vh] border-0"
            sandbox="allow-same-origin"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReportsTab() {
  const { reports, loading, refetch } = useReports();
  const [viewingReport, setViewingReport] = useState<Report | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          Agent Reports
          {reports.length > 0 && (
            <Badge variant="outline" className="ml-2 text-[10px] border-primary/30 text-primary">
              {reports.length}
            </Badge>
          )}
        </h3>
        <button
          onClick={refetch}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {reports.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <ExternalLink size={32} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No reports uploaded yet.</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {reports.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <GlassCard className="p-0 overflow-hidden">
                <button
                  className="w-full p-3 flex items-center gap-3 text-left hover:bg-secondary/20 transition-colors"
                  onClick={() => setViewingReport(report)}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0 text-lg">
                    {report.agent_emoji || '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-foreground truncate">{report.title}</span>
                      <Badge variant="outline" className="text-[10px] border-primary/30 text-primary shrink-0">
                        {report.file_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {report.agent_name && (
                        <span className="text-[10px] text-muted-foreground">
                          by {report.agent_name}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatDistanceToNow(parseISO(report.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-muted-foreground shrink-0" />
                </button>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      <ReportViewerDialog
        report={viewingReport}
        open={viewingReport !== null}
        onOpenChange={(open) => { if (!open) setViewingReport(null); }}
      />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const Automations = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold font-heading text-foreground">Automations</h2>

      <Tabs defaultValue="webhooks" className="w-full">
        <TabsList className="bg-secondary/30 border border-secondary/50">
          <TabsTrigger value="webhooks" className="text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            Webhooks & Functions
          </TabsTrigger>
          <TabsTrigger value="queue" className="text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            Webhook Queue
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="mt-4">
          <WebhooksTab />
        </TabsContent>
        <TabsContent value="queue" className="mt-4">
          <QueueTab />
        </TabsContent>
        <TabsContent value="reports" className="mt-4">
          <ReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Automations;
