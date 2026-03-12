import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, User, Users, Brain, Bot, Wrench, Activity,
  ArrowLeft, Pencil, Plus, Calendar, BookOpen, ChevronDown, ChevronRight,
} from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { fetchAgents, type AgentRecord } from '@/features/platform/api';
import { useAgentIdentity, type IdentityCard } from '@/hooks/useAgentIdentity';
import { useAgentDailyLogs, type DailyLog } from '@/hooks/useAgentDailyLogs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/* ── icon map for card types ── */
const cardIcons: Record<string, React.ElementType> = {
  soul: Heart,
  identity: User,
  user: Users,
  memory: Brain,
  agents: Bot,
  tools: Wrench,
  heartbeat: Activity,
};

const cardColors: Record<string, string> = {
  soul: 'text-red-400',
  identity: 'text-blue-400',
  user: 'text-purple-400',
  memory: 'text-emerald-400',
  agents: 'text-amber-400',
  tools: 'text-cyan-400',
  heartbeat: 'text-pink-400',
};

/* ── helpers ── */
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ══════════════════════════════════════════════
   Identity Page – main export
   ══════════════════════════════════════════════ */
const Identity = () => {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agentLoading, setAgentLoading] = useState(true);

  // counts for the agent list view
  const [cardCounts, setCardCounts] = useState<Record<string, number>>({});
  const [logCounts, setLogCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      try {
        const a = await fetchAgents();
        setAgents(a);

        // fetch counts
        const { data: cc } = await supabase
          .from('agent_identity_cards')
          .select('agent_id');
        const { data: lc } = await supabase
          .from('agent_daily_logs')
          .select('agent_id');

        const cards: Record<string, number> = {};
        (cc ?? []).forEach((r: any) => { cards[r.agent_id] = (cards[r.agent_id] || 0) + 1; });
        setCardCounts(cards);

        const logs: Record<string, number> = {};
        (lc ?? []).forEach((r: any) => { logs[r.agent_id] = (logs[r.agent_id] || 0) + 1; });
        setLogCounts(logs);
      } finally {
        setAgentLoading(false);
      }
    })();
  }, []);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  if (selectedAgentId && selectedAgent) {
    return (
      <AgentDetailView
        agent={selectedAgent}
        onBack={() => setSelectedAgentId(null)}
      />
    );
  }

  /* ── All Agents grid ── */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-heading text-foreground">Agent Identities</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage soul, memory, and heartbeat for each agent</p>
        </div>
      </div>

      {agentLoading ? (
        <div className="text-muted-foreground text-sm">Loading agents...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, i) => (
            <GlassCard
              key={agent.id}
              hover
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
              className="cursor-pointer"
              onClick={() => setSelectedAgentId(agent.id)}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center text-3xl border border-primary/10">
                  {agent.emoji || '🤖'}
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading text-foreground">{agent.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {agent.name === 'Rei' ? 'Daemon agent — task executor' : agent.name === 'Bujji' ? 'Assistant — builder & planner' : 'AI Agent'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  {cardCounts[agent.id] || 0} cards
                </Badge>
                <Badge variant="outline" className="text-xs border-accent/30 text-accent">
                  {logCounts[agent.id] || 0} logs
                </Badge>
                <Badge
                  className="text-xs ml-auto"
                  variant="outline"
                  style={{ backgroundColor: 'hsl(160 84% 39% / 0.15)', color: 'hsl(160 84% 39%)', borderColor: 'hsl(160 84% 39% / 0.3)' }}
                >
                  Active
                </Badge>
              </div>

              <button className="w-full mt-auto py-2.5 rounded-lg border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 hover:border-primary/50 hover:shadow-[0_0_15px_hsl(160_84%_39%/0.15)] transition-all duration-300">
                View Identity →
              </button>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════
   Agent Detail View
   ══════════════════════════════════════════════ */
function AgentDetailView({ agent, onBack }: { agent: AgentRecord; onBack: () => void }) {
  const { cards, loading: cardsLoading, updateCard } = useAgentIdentity(agent.id);
  const { logs, loading: logsLoading, createLog, updateLog } = useAgentDailyLogs(agent.id);

  const [editCard, setEditCard] = useState<IdentityCard | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const [newLogOpen, setNewLogOpen] = useState(false);
  const [newLogTitle, setNewLogTitle] = useState('');
  const [newLogContent, setNewLogContent] = useState('');
  const [newLogDate, setNewLogDate] = useState(new Date().toISOString().slice(0, 10));

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [editLog, setEditLog] = useState<DailyLog | null>(null);
  const [editLogContent, setEditLogContent] = useState('');

  const description = agent.name === 'Rei'
    ? "Daemon agent. Executes tasks, follows heartbeat, reports progress."
    : agent.name === 'Bujji'
    ? "Assistant agent. Builds features, plans architecture, writes code."
    : "AI Agent";

  /* ── save card ── */
  async function handleSaveCard() {
    if (!editCard) return;
    setSaving(true);
    try {
      await updateCard(editCard.id, editContent, 'You');
      toast.success(`${editCard.title} updated`);
      setEditCard(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  /* ── create daily log ── */
  async function handleCreateLog() {
    try {
      await createLog(newLogDate, newLogTitle || `Daily Log — ${newLogDate}`, newLogContent, 'You');
      toast.success('Daily log created');
      setNewLogOpen(false);
      setNewLogTitle('');
      setNewLogContent('');
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  /* ── save log edit ── */
  async function handleSaveLog() {
    if (!editLog) return;
    try {
      await updateLog(editLog.id, editLogContent);
      toast.success('Log updated');
      setEditLog(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  /* ── card order ── */
  const cardOrder = ['soul', 'identity', 'user', 'memory', 'agents', 'tools', 'heartbeat'];
  const sortedCards = [...cards].sort((a, b) => cardOrder.indexOf(a.card_type) - cardOrder.indexOf(b.card_type));

  return (
    <div className="space-y-6">
      {/* Back + Agent Header */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={16} /> All Agents
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center text-4xl border border-primary/10">
            {agent.emoji || '🤖'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold font-heading text-foreground">{agent.name}</h2>
              <Badge variant="outline" className="text-xs border-primary/30 text-primary">Default</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
      </motion.div>

      {/* Identity Cards Grid */}
      {cardsLoading ? (
        <div className="text-muted-foreground text-sm">Loading identity cards...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCards.map((card, i) => {
            const Icon = cardIcons[card.card_type] || BookOpen;
            const color = cardColors[card.card_type] || 'text-muted-foreground';
            const hasContent = card.content_md.trim().length > 0;

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <GlassCard
                  hover
                  className="cursor-pointer group"
                  onClick={() => { setEditCard(card); setEditContent(card.content_md); }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon size={18} className={color} />
                      <span className="font-bold font-heading text-sm text-foreground">{card.title}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${hasContent ? 'border-primary/30 text-primary' : 'border-amber-400/30 text-amber-400'}`}
                    >
                      {hasContent ? 'Editable' : 'Empty'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{card.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
                    <span>Last edit by {card.updated_by || 'System'}</span>
                    <span>{timeAgo(card.updated_at)}</span>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Daily Memory Logs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            <h3 className="text-lg font-bold font-heading text-foreground">Daily Memory Logs</h3>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">{logs.length}</Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => setNewLogOpen(true)}
          >
            <Plus size={14} /> New Log
          </Button>
        </div>

        {logsLoading ? (
          <div className="text-muted-foreground text-sm">Loading logs...</div>
        ) : logs.length === 0 ? (
          <GlassCard className="text-center text-muted-foreground text-sm py-8">
            No daily logs yet. Create the first one!
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <GlassCard key={log.id} className="p-3">
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar size={14} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          {new Date(log.log_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{log.title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground/60">Written by {log.written_by || 'Unknown'}</span>
                      <span className="text-[10px] text-muted-foreground/60">{timeAgo(log.created_at)}</span>
                      {isExpanded ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 border-t border-white/5"
                    >
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-black/20 rounded-lg p-3 max-h-60 overflow-auto">
                        {log.content_md || '(empty)'}
                      </pre>
                      <div className="flex justify-end mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                          onClick={(e) => { e.stopPropagation(); setEditLog(log); setEditLogContent(log.content_md); }}
                        >
                          <Pencil size={12} /> Edit
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── Edit Card Dialog ── */}
      <Dialog open={!!editCard} onOpenChange={(open) => { if (!open) setEditCard(null); }}>
        <DialogContent className="bg-zinc-900 border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editCard && (() => {
                const Icon = cardIcons[editCard.card_type] || BookOpen;
                return <Icon size={18} className={cardColors[editCard.card_type]} />;
              })()}
              {editCard?.title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2">{editCard?.description}</p>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[300px] font-mono text-sm bg-black/30 border-white/10"
            placeholder={`Write ${editCard?.title} content in markdown...`}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditCard(null)}>Cancel</Button>
            <Button onClick={handleSaveCard} disabled={saving} className="gap-1.5">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── New Daily Log Dialog ── */}
      <Dialog open={newLogOpen} onOpenChange={setNewLogOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Daily Memory Log</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date</label>
              <Input
                type="date"
                value={newLogDate}
                onChange={(e) => setNewLogDate(e.target.value)}
                className="bg-black/30 border-white/10"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Title</label>
              <Input
                value={newLogTitle}
                onChange={(e) => setNewLogTitle(e.target.value)}
                placeholder={`Daily Log — ${newLogDate}`}
                className="bg-black/30 border-white/10"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Content</label>
              <Textarea
                value={newLogContent}
                onChange={(e) => setNewLogContent(e.target.value)}
                className="min-h-[200px] font-mono text-sm bg-black/30 border-white/10"
                placeholder="Write your daily log in markdown..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewLogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateLog} className="gap-1.5">
              <Plus size={14} /> Create Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Log Dialog ── */}
      <Dialog open={!!editLog} onOpenChange={(open) => { if (!open) setEditLog(null); }}>
        <DialogContent className="bg-zinc-900 border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Daily Log — {editLog?.log_date}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editLogContent}
            onChange={(e) => setEditLogContent(e.target.value)}
            className="min-h-[300px] font-mono text-sm bg-black/30 border-white/10"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditLog(null)}>Cancel</Button>
            <Button onClick={handleSaveLog} className="gap-1.5">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Identity;
