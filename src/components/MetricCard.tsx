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
    glow
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1, duration: 0.4 }}
    className="group relative overflow-hidden"
  >
    {/* Shimmer overlay */}
    <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

    <div className="relative z-10">
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 glow-primary">
          <Icon size={22} className="text-primary" />
        </div>
        {trend && <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">{trend}</span>}
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
    </div>
  </GlassCard>
);

export default MetricCard;
