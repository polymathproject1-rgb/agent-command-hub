import { motion } from 'framer-motion';
import { Mic, Calendar, CheckSquare, BarChart3, ArrowRight, Sparkles, Clock, Users, FileText, Phone, Mail } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { useNavigation } from '@/contexts/NavigationContext';
import { useFathomMeetings } from '@/hooks/useFathomMeetings';
import { isAfter, subDays, parseISO } from 'date-fns';

interface OpCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  accentColor: string;
  stats?: { label: string; value: string }[];
  onClick?: () => void;
  index: number;
  badge?: string;
  comingSoon?: boolean;
}

const OpCard = ({ icon: Icon, title, description, accentColor, stats, onClick, index, badge, comingSoon }: OpCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08, duration: 0.4 }}
  >
    <button
      onClick={onClick}
      disabled={comingSoon}
      className={`w-full text-left group relative overflow-hidden rounded-xl border transition-all duration-300 ${
        comingSoon
          ? 'border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed'
          : 'border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.05] cursor-pointer'
      }`}
    >
      {/* Glow accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
      />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div
            className="p-2.5 rounded-xl"
            style={{ backgroundColor: `${accentColor}15` }}
          >
            <Icon size={22} style={{ color: accentColor }} />
          </div>
          <div className="flex items-center gap-2">
            {badge && (
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
              >
                {badge}
              </span>
            )}
            {comingSoon && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">
                Coming Soon
              </span>
            )}
            {!comingSoon && (
              <ArrowRight
                size={16}
                className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200"
              />
            )}
          </div>
        </div>

        {/* Title + description */}
        <div>
          <h3 className="text-sm font-semibold text-foreground font-heading">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
        </div>

        {/* Stats row */}
        {stats && stats.length > 0 && (
          <div className="flex items-center gap-4 pt-1">
            {stats.map((stat, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-lg font-bold font-heading text-foreground">{stat.value}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </button>
  </motion.div>
);

const OpCenter = () => {
  const { navigateTo } = useNavigation();
  const { meetings, loading } = useFathomMeetings();

  // Compute live stats from Fathom data
  const thisWeekMeetings = meetings.filter(m => isAfter(parseISO(m.date), subDays(new Date(), 7))).length;
  const openActions = meetings.reduce((acc, m) => acc + m.action_items.filter(a => !a.done).length, 0);
  const totalMeetings = meetings.length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-primary/15">
            <Sparkles size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-foreground">Operations Center</h2>
            <p className="text-xs text-muted-foreground font-mono">Intelligence modules &amp; operational dashboards</p>
          </div>
        </div>
      </motion.div>

      <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <OpCard
          index={0}
          icon={Mic}
          title="Jane Meeting Assistant"
          description="AI-powered meeting insights from Fathom. Track action items, attendees, and decisions across all your calls."
          accentColor="#a78bfa"
          badge={loading ? 'loading...' : `${totalMeetings} meetings`}
          stats={[
            { label: 'this week', value: String(thisWeekMeetings) },
            { label: 'actions', value: String(openActions) },
          ]}
          onClick={() => navigateTo('meetings')}
        />

        <OpCard
          index={1}
          icon={Phone}
          title="Lexa AI Phone"
          description="AI-powered outbound voice calls. Manage leads, campaigns, and view real-time transcripts with sentiment analysis."
          accentColor="#2dd4bf"
          badge="Active"
          onClick={() => navigateTo('lexa')}
        />

        <OpCard
          index={2}
          icon={Mail}
          title="Nova AI SDR"
          description="AI email employee — send personalized sequences, track engagement, manage campaigns with daily send limits."
          accentColor="#f472b6"
          badge="Active"
          onClick={() => navigateTo('nova')}
        />

        <OpCard
          index={3}
          icon={CheckSquare}
          title="Action Tracker"
          description="Aggregate action items from all meetings. Track completion, assign owners, and set deadlines."
          accentColor="#60a5fa"
          comingSoon
        />

        <OpCard
          index={4}
          icon={BarChart3}
          title="Analytics & Reports"
          description="Meeting frequency, duration trends, busiest days, and team collaboration metrics."
          accentColor="#fbbf24"
          comingSoon
        />

        <OpCard
          index={5}
          icon={Users}
          title="Contact Intelligence"
          description="Track relationships across meetings. See interaction history, frequency, and last touchpoint per contact."
          accentColor="#a78bfa"
          comingSoon
        />

        <OpCard
          index={6}
          icon={FileText}
          title="Proposals & Follow-ups"
          description="Auto-generate proposals, follow-up emails, and meeting summaries from your call recordings."
          accentColor="#fb923c"
          comingSoon
        />
      </div>
    </div>
  );
};

export default OpCenter;
