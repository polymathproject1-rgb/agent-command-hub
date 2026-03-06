import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle, Clock, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import GlassCard from '@/components/GlassCard';
import { councilSessions } from '@/data/mockData';
import { formatDistanceToNow, parseISO } from 'date-fns';

const statusIcons: Record<string, React.ReactNode> = {
  done: <CheckCircle size={12} className="text-primary" />,
  pending: <Clock size={12} className="text-warning" />,
  speaking: <MessageCircle size={12} className="text-accent" />,
};

const Council = () => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold font-heading text-foreground">Council Sessions</h2>
      {councilSessions.map((session, si) => (
        <GlassCard
          key={session.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: si * 0.1 }}
          className={`p-0 overflow-hidden transition-shadow duration-300 ${
            session.status === 'active'
              ? 'shadow-[0_0_20px_hsl(187_92%_43%/0.15)]'
              : 'shadow-[0_0_15px_hsl(160_84%_39%/0.1)]'
          }`}
        >
          <button
            className="w-full p-5 flex items-start gap-3 text-left hover:bg-secondary/20 transition-colors"
            onClick={() => setExpanded(expanded === session.id ? null : session.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="outline" className={session.status === 'active' ? 'border-accent/40 text-accent animate-glow-pulse' : 'border-primary/40 text-primary'}>
                  {session.status}
                </Badge>
                <h3 className="text-sm font-medium text-foreground">{session.question}</h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {session.participants.map((p) => (
                  <span key={p.name} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/50 text-xs text-secondary-foreground border border-transparent hover:border-primary/20 transition-colors">
                    {p.emoji} {p.name}
                    <span className="font-mono text-muted-foreground">{p.sent}/{p.limit}</span>
                    {statusIcons[p.status]}
                  </span>
                ))}
              </div>
            </div>
            <motion.div
              animate={{ rotate: expanded === session.id ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={18} className="text-muted-foreground" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expanded === session.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 border-t border-secondary space-y-3 pt-4">
                  {session.messages.map((msg, mi) => (
                    <motion.div
                      key={mi}
                      className="flex items-start gap-3 p-3 rounded-lg glass-card border border-secondary/50"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: mi * 0.08 }}
                    >
                      <span className="text-lg">{msg.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">{msg.name}</span>
                          <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 rounded">#{msg.number}</span>
                          <span className="text-xs text-muted-foreground font-mono ml-auto">
                            {formatDistanceToNow(parseISO(msg.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80">{msg.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      ))}
    </div>
  );
};

export default Council;
