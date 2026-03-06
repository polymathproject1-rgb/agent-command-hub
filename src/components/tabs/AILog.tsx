import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { logEntries } from '@/data/mockData';
import { formatDistanceToNow, parseISO } from 'date-fns';

const categoryStyles: Record<string, { bg: string; text: string }> = {
  observation: { bg: 'bg-primary/15', text: 'text-primary' },
  general: { bg: 'bg-muted', text: 'text-muted-foreground' },
  reminder: { bg: 'bg-warning/15', text: 'text-warning' },
  fyi: { bg: 'bg-accent/15', text: 'text-accent' },
};

const AILog = () => {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? logEntries : logEntries.filter(e => e.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold font-heading text-foreground">AI Log</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px] glass-card border-secondary">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent className="glass-card border-secondary">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="observation">Observation</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="reminder">Reminder</SelectItem>
            <SelectItem value="fyi">FYI</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-3 pr-3">
          {filtered.map((entry, i) => {
            const style = categoryStyles[entry.category];
            return (
              <motion.div
                key={entry.id}
                className="glass-card p-4 flex items-start gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="text-lg mt-0.5">{entry.agentEmoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{entry.agentName}</span>
                    <Badge variant="outline" className={`text-xs border-0 ${style.bg} ${style.text}`}>
                      {entry.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground/80">{entry.message}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {formatDistanceToNow(parseISO(entry.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default AILog;
