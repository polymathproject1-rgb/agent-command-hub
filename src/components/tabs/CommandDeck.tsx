import { motion } from 'framer-motion';
import { Zap, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import MetricCard from '@/components/MetricCard';
import GlassCard from '@/components/GlassCard';
import { agents, activityFeed } from '@/data/mockData';
import { formatDistanceToNow, parseISO } from 'date-fns';

const statusColors: Record<string, string> = {
  active: 'bg-primary',
  idle: 'bg-amber',
  error: 'bg-destructive',
  offline: 'bg-muted-foreground',
};

const CommandDeck = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard icon={Zap} label="Active Agents" value="3" trend="+1 today" index={0} />
      <MetricCard icon={CheckCircle} label="Tasks Completed" value="807" trend="+24 today" index={1} />
      <MetricCard icon={AlertTriangle} label="Open Alerts" value="2" trend="↓ from 5" index={2} />
      <MetricCard icon={Clock} label="Avg Response" value="1.2s" trend="-0.3s" index={3} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <GlassCard className="lg:col-span-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
        <h3 className="text-sm font-semibold text-foreground mb-3 font-heading">Recent Activity</h3>
        <ScrollArea className="h-[320px]">
          <div className="space-y-3 pr-3">
            {activityFeed.map((event, i) => (
              <motion.div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
              >
                <span className="text-lg mt-0.5">{event.agentEmoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{event.action}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {formatDistanceToNow(parseISO(event.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </GlassCard>

      <GlassCard className="lg:col-span-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
        <h3 className="text-sm font-semibold text-foreground mb-3 font-heading">Agent Status</h3>
        <div className="space-y-3">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.id}
              className="p-3 rounded-lg bg-secondary/30 border border-secondary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{agent.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{agent.name}</p>
                    <span className={`relative flex h-2 w-2`}>
                      {agent.status === 'active' && <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: agent.accentColor }} />}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${statusColors[agent.status]}`} />
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{agent.currentActivity}</p>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{agent.lastSeen}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  </div>
);

export default CommandDeck;
