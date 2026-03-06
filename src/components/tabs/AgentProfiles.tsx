import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/GlassCard';
import { agents } from '@/data/mockData';

const statusLabel: Record<string, string> = {
  active: 'Active', idle: 'Idle', error: 'Error', offline: 'Offline',
};

const AgentProfiles = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {agents.map((agent, i) => (
      <GlassCard
        key={agent.id}
        hover
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.1, duration: 0.4 }}
        className="flex flex-col"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{agent.emoji}</span>
          <div>
            <h3 className="text-lg font-bold font-heading text-foreground">{agent.name}</h3>
            <p className="text-xs text-muted-foreground">{agent.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">{agent.type}</Badge>
          <Badge variant="outline" className="text-xs border-accent/30 text-accent">{agent.role}</Badge>
          <Badge
            className="text-xs ml-auto"
            style={{ backgroundColor: `${agent.accentColor}20`, color: agent.accentColor, borderColor: `${agent.accentColor}40` }}
            variant="outline"
          >
            {statusLabel[agent.status]}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-secondary/30">
            <p className="text-2xl font-bold font-heading text-foreground">{agent.tasksCompleted}</p>
            <p className="text-xs text-muted-foreground">Tasks Done</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30">
            <p className="text-2xl font-bold font-heading text-foreground">{agent.accuracy}%</p>
            <p className="text-xs text-muted-foreground">Accuracy</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {agent.skills.map((skill) => (
            <span key={skill} className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground font-mono">
              {skill}
            </span>
          ))}
        </div>

        <button
          className="w-full mt-auto py-2 rounded-lg border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
        >
          View Details
        </button>
      </GlassCard>
    ))}
  </div>
);

export default AgentProfiles;
