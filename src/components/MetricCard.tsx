import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import GlassCard from './GlassCard';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  trend?: string;
  index?: number;
}

const MetricCard = ({ icon: Icon, label, value, trend, index = 0 }: MetricCardProps) => (
  <GlassCard
    hover
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1, duration: 0.4 }}
  >
    <div className="flex items-start justify-between">
      <div className="p-2 rounded-lg bg-primary/10 glow-primary">
        <Icon size={20} className="text-primary" />
      </div>
      {trend && <span className="text-xs font-mono text-primary">{trend}</span>}
    </div>
    <motion.p
      className="mt-3 text-3xl font-bold font-heading text-foreground"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
    >
      {value}
    </motion.p>
    <p className="text-sm text-muted-foreground mt-1">{label}</p>
  </GlassCard>
);

export default MetricCard;
