import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, TrendingUp, CheckSquare, Clock, Search, Globe, Sparkles, ExternalLink, Share2, ChevronDown } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import MetricCard from '@/components/MetricCard';
import GlassCard from '@/components/GlassCard';
import { meetings } from '@/data/mockData';
import { format, parseISO, formatDistanceToNow, isAfter, subDays } from 'date-fns';
import DOMPurify from 'dompurify';

const typeColors: Record<string, string> = {
  'standup': '#818cf8',
  'sales': '#34d399',
  '1-on-1': '#60a5fa',
  'external': '#a78bfa',
  'team': '#fb923c',
  'planning': '#2dd4bf',
};

const MeetingIntelligence = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [hasActionItems, setHasActionItems] = useState(false);
  const [externalOnly, setExternalOnly] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...meetings];
    if (searchQuery) result = result.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));
    if (typeFilter !== 'all') result = result.filter(m => m.meeting_type === typeFilter);
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      result = result.filter(m => isAfter(parseISO(m.date), subDays(new Date(), days)));
    }
    if (hasActionItems) result = result.filter(m => m.action_items.length > 0);
    if (externalOnly) result = result.filter(m => m.has_external_participants);
    result.sort((a, b) => {
      if (sortBy === 'recent') return parseISO(b.date).getTime() - parseISO(a.date).getTime();
      if (sortBy === 'oldest') return parseISO(a.date).getTime() - parseISO(b.date).getTime();
      return b.duration_minutes - a.duration_minutes;
    });
    return result;
  }, [searchQuery, typeFilter, dateRange, hasActionItems, externalOnly, sortBy]);

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    meetings.forEach(m => { counts[m.meeting_type] = (counts[m.meeting_type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value, color: typeColors[name] || '#6b7280' }));
  }, []);

  const monthlyTrend = useMemo(() => {
    const counts: Record<string, number> = {};
    meetings.forEach(m => {
      const month = format(parseISO(m.date), 'MMM');
      counts[month] = (counts[month] || 0) + 1;
    });
    return Object.entries(counts).map(([month, count]) => ({ month, count }));
  }, []);

  const totalMeetings = meetings.length;
  const thisWeek = meetings.filter(m => isAfter(parseISO(m.date), subDays(new Date(), 7))).length;
  const openActions = meetings.reduce((acc, m) => acc + m.action_items.filter(a => !a.done).length, 0);
  const avgDuration = Math.round(meetings.reduce((acc, m) => acc + m.duration_minutes, 0) / meetings.length);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Calendar} label="Total Meetings" value={String(totalMeetings)} index={0} />
        <MetricCard icon={TrendingUp} label="This Week" value={String(thisWeek)} index={1} />
        <MetricCard icon={CheckSquare} label="Open Action Items" value={String(openActions)} index={2} />
        <MetricCard icon={Clock} label="Avg Duration" value={`${avgDuration}m`} index={3} />
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard glow initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="text-sm font-semibold text-foreground mb-4 font-heading">Meeting Type Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={typeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                {typeDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f9fafb' }} />
              <Legend formatter={(value) => <span style={{ color: '#9ca3af', fontSize: '12px' }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard glow initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h3 className="text-sm font-semibold text-foreground mb-4 font-heading">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyTrend}>
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f9fafb' }} />
              <Bar dataKey="count" fill="hsl(160 84% 39%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <GlassCard initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary/30 border-secondary"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] bg-secondary/30 border-secondary"><SelectValue /></SelectTrigger>
            <SelectContent className="glass-card border-secondary">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="standup">Standup</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="1-on-1">1-on-1</SelectItem>
              <SelectItem value="team">Team</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="external">External</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[120px] bg-secondary/30 border-secondary"><SelectValue /></SelectTrigger>
            <SelectContent className="glass-card border-secondary">
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px] bg-secondary/30 border-secondary"><SelectValue /></SelectTrigger>
            <SelectContent className="glass-card border-secondary">
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="duration">Longest Duration</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={hasActionItems} onCheckedChange={setHasActionItems} />
            Has Action Items
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={externalOnly} onCheckedChange={setExternalOnly} />
            External Only
          </label>
        </div>
      </GlassCard>

      <ScrollArea className="h-[600px]">
        <div className="space-y-3 pr-3">
          {filtered.map((meeting, i) => (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <div className="glass-card overflow-hidden glow-border-hover border border-transparent transition-all duration-200" style={{ borderLeftColor: typeColors[meeting.meeting_type] || 'transparent', borderLeftWidth: '3px' }}>
                <button
                  className="w-full p-4 flex items-center gap-4 text-left hover:bg-secondary/20 transition-colors"
                  onClick={() => setExpandedId(expandedId === meeting.id ? null : meeting.id)}
                >
                  <Badge
                    className="text-xs shrink-0"
                    style={{ backgroundColor: `${typeColors[meeting.meeting_type] || '#6b7280'}20`, color: typeColors[meeting.meeting_type] || '#6b7280', borderColor: `${typeColors[meeting.meeting_type] || '#6b7280'}40` }}
                    variant="outline"
                  >
                    {meeting.meeting_type}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{meeting.title}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {formatDistanceToNow(parseISO(meeting.date), { addSuffix: true })} · {meeting.duration_display}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 shrink-0">
                    {meeting.attendees.slice(0, 3).map((a, ai) => (
                      <span
                        key={ai}
                        className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-xs font-mono text-secondary-foreground -ml-1 first:ml-0 border border-background"
                        title={a}
                      >
                        {getInitials(a)}
                      </span>
                    ))}
                    {meeting.attendees.length > 3 && (
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-xs font-mono text-muted-foreground -ml-1 border border-background">
                        +{meeting.attendees.length - 3}
                      </span>
                    )}
                  </div>
                  {meeting.action_items.length > 0 && (
                    <Badge variant="outline" className="shrink-0 border-primary/30 text-primary text-xs">
                      {meeting.action_items.filter(a => !a.done).length} actions
                    </Badge>
                  )}
                  {meeting.has_external_participants && <Globe size={14} className="text-accent shrink-0" />}
                  <motion.div animate={{ rotate: expandedId === meeting.id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={16} className="text-muted-foreground" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {expandedId === meeting.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-secondary pt-4 space-y-4">
                        <div
                          className="text-sm text-foreground/80 prose prose-invert prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(meeting.summary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')) }}
                        />

                        {meeting.action_items.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-foreground mb-2 font-heading">Action Items</h4>
                            <div className="space-y-1.5">
                              {meeting.action_items.map((item, ai) => (
                                <div key={ai} className="flex items-center gap-2 text-sm">
                                  <input type="checkbox" checked={item.done} readOnly className="rounded border-secondary accent-primary" />
                                  <span className={item.done ? 'line-through text-muted-foreground' : 'text-foreground'}>{item.task}</span>
                                  <span className="text-xs text-muted-foreground ml-auto font-mono">→ {item.assignee}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Sparkles size={12} className="text-primary" />
                          <span>{meeting.ai_insights}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Attendees:</span>
                          {meeting.attendees.join(', ')}
                        </div>

                        {meeting.external_domains.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Globe size={12} />
                            <span>External: {meeting.external_domains.join(', ')}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-2">
                          {meeting.fathom_url && (
                            <a href={meeting.fathom_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs hover:bg-primary/20 hover:shadow-[0_0_10px_hsl(160_84%_39%/0.2)] transition-all">
                              <ExternalLink size={12} /> Open Recording
                            </a>
                          )}
                          {meeting.share_url && (
                            <a href={meeting.share_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs hover:bg-accent/20 hover:shadow-[0_0_10px_hsl(187_92%_43%/0.2)] transition-all">
                              <Share2 size={12} /> Share Link
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MeetingIntelligence;
