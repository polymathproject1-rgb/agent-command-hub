export type AgentStatus = 'active' | 'idle' | 'error' | 'offline';

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  subtitle: string;
  type: string;
  role: string;
  status: AgentStatus;
  accentColor: string;
  tasksCompleted: number;
  accuracy: number;
  skills: string[];
  currentActivity: string;
  lastSeen: string;
}

export interface Task {
  id: string;
  title: string;
  agentEmoji: string;
  agentName: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress?: number;
  column: 'todo' | 'doing' | 'needs-input' | 'done';
}

export interface LogEntry {
  id: string;
  agentEmoji: string;
  agentName: string;
  message: string;
  category: 'observation' | 'general' | 'reminder' | 'fyi';
  timestamp: string;
}

export interface CouncilSession {
  id: string;
  question: string;
  status: 'active' | 'completed';
  participants: { emoji: string; name: string; sent: number; limit: number; status: 'done' | 'pending' | 'speaking' }[];
  messages: { emoji: string; name: string; number: number; text: string; timestamp: string }[];
}

export interface Meeting {
  id: string;
  type: string;
  title: string;
  date: string;
  duration_minutes: number;
  duration_display: string;
  attendees: string[];
  summary: string;
  action_items: { task: string; assignee: string; done: boolean }[];
  ai_insights: string;
  meeting_type: string;
  sentiment: string;
  has_external_participants: boolean;
  external_domains: string[];
  fathom_url: string | null;
  share_url: string | null;
}

export interface ActivityEvent {
  id: string;
  agentEmoji: string;
  agentName: string;
  action: string;
  timestamp: string;
}

export const agents: Agent[] = [
  {
    id: '1', name: 'Agent Alpha', emoji: '🤖', subtitle: 'Your Lead AI Engineer',
    type: 'Code Agent', role: 'Lead Engineer', status: 'active', accentColor: '#10b981',
    tasksCompleted: 342, accuracy: 97.2, skills: ['TypeScript', 'Python', 'Code Review', 'Architecture', 'Testing'],
    currentActivity: 'Reviewing PR #847', lastSeen: 'just now',
  },
  {
    id: '2', name: 'Dispatch Bot', emoji: '📋', subtitle: 'Operations Coordinator',
    type: 'Coordinator', role: 'Operations Director', status: 'idle', accentColor: '#f59e0b',
    tasksCompleted: 189, accuracy: 94.8, skills: ['Task Routing', 'Scheduling', 'Priority Management', 'Escalation'],
    currentActivity: 'Queue idle — awaiting tasks', lastSeen: '2 min ago',
  },
  {
    id: '3', name: 'Audit Bot', emoji: '🛡️', subtitle: 'Quality & Compliance',
    type: 'Quality Agent', role: 'Compliance Officer', status: 'active', accentColor: '#06b6d4',
    tasksCompleted: 276, accuracy: 99.1, skills: ['Code Audit', 'Security Scan', 'Compliance', 'Documentation'],
    currentActivity: 'Running security audit on v2.3', lastSeen: 'just now',
  },
];

export const tasks: Task[] = [
  { id: 't1', title: 'Set up CI/CD pipeline for staging', agentEmoji: '🤖', agentName: 'Agent Alpha', priority: 'high', column: 'todo' },
  { id: 't2', title: 'Draft Q1 compliance report', agentEmoji: '🛡️', agentName: 'Audit Bot', priority: 'medium', column: 'todo' },
  { id: 't3', title: 'Optimize database query performance', agentEmoji: '🤖', agentName: 'Agent Alpha', priority: 'urgent', progress: 65, column: 'doing' },
  { id: 't4', title: 'Route incoming support tickets', agentEmoji: '📋', agentName: 'Dispatch Bot', priority: 'medium', progress: 30, column: 'doing' },
  { id: 't5', title: 'Review security scan results', agentEmoji: '🛡️', agentName: 'Audit Bot', priority: 'high', column: 'needs-input' },
  { id: 't6', title: 'Clarify API rate limit requirements', agentEmoji: '🤖', agentName: 'Agent Alpha', priority: 'medium', column: 'needs-input' },
  { id: 't7', title: 'Deploy v2.2.1 hotfix', agentEmoji: '🤖', agentName: 'Agent Alpha', priority: 'urgent', column: 'done' },
  { id: 't8', title: 'Update onboarding documentation', agentEmoji: '📋', agentName: 'Dispatch Bot', priority: 'low', column: 'done' },
  { id: 't9', title: 'Audit third-party dependencies', agentEmoji: '🛡️', agentName: 'Audit Bot', priority: 'high', column: 'done' },
  { id: 't10', title: 'Migrate legacy endpoints to v3', agentEmoji: '🤖', agentName: 'Agent Alpha', priority: 'high', column: 'todo' },
];

export const logEntries: LogEntry[] = [
  { id: 'l1', agentEmoji: '🤖', agentName: 'Agent Alpha', message: 'Detected unused import in auth.service.ts — auto-removed.', category: 'observation', timestamp: '2026-03-06T09:45:00Z' },
  { id: 'l2', agentEmoji: '📋', agentName: 'Dispatch Bot', message: 'Reassigned 3 tickets from overflow queue to Agent Alpha.', category: 'general', timestamp: '2026-03-06T09:30:00Z' },
  { id: 'l3', agentEmoji: '🛡️', agentName: 'Audit Bot', message: 'Reminder: SSL certificate expires in 14 days.', category: 'reminder', timestamp: '2026-03-06T09:15:00Z' },
  { id: 'l4', agentEmoji: '🤖', agentName: 'Agent Alpha', message: 'PR #842 merged — all 47 tests passing.', category: 'fyi', timestamp: '2026-03-06T09:00:00Z' },
  { id: 'l5', agentEmoji: '🛡️', agentName: 'Audit Bot', message: 'Found 2 medium-severity vulnerabilities in lodash@4.17.20.', category: 'observation', timestamp: '2026-03-06T08:45:00Z' },
  { id: 'l6', agentEmoji: '📋', agentName: 'Dispatch Bot', message: 'Daily standup summary generated and posted to #engineering.', category: 'general', timestamp: '2026-03-06T08:30:00Z' },
  { id: 'l7', agentEmoji: '🤖', agentName: 'Agent Alpha', message: 'Query optimization reduced p95 latency by 34%.', category: 'observation', timestamp: '2026-03-06T08:15:00Z' },
  { id: 'l8', agentEmoji: '🛡️', agentName: 'Audit Bot', message: 'FYI: New GDPR data retention policy published.', category: 'fyi', timestamp: '2026-03-06T08:00:00Z' },
  { id: 'l9', agentEmoji: '📋', agentName: 'Dispatch Bot', message: 'Reminder: Sprint review scheduled for Friday 3pm.', category: 'reminder', timestamp: '2026-03-06T07:45:00Z' },
  { id: 'l10', agentEmoji: '🤖', agentName: 'Agent Alpha', message: 'Refactored payment module — reduced bundle size by 12%.', category: 'observation', timestamp: '2026-03-06T07:30:00Z' },
];

export const councilSessions: CouncilSession[] = [
  {
    id: 'c1',
    question: 'Should we migrate from REST to GraphQL for the public API?',
    status: 'completed',
    participants: [
      { emoji: '🤖', name: 'Agent Alpha', sent: 3, limit: 3, status: 'done' },
      { emoji: '📋', name: 'Dispatch Bot', sent: 2, limit: 3, status: 'done' },
      { emoji: '🛡️', name: 'Audit Bot', sent: 3, limit: 3, status: 'done' },
    ],
    messages: [
      { emoji: '🤖', name: 'Agent Alpha', number: 1, text: 'GraphQL would reduce over-fetching significantly. Our mobile clients currently make 4-5 REST calls per screen that could be collapsed into one query.', timestamp: '2026-03-05T14:00:00Z' },
      { emoji: '🛡️', name: 'Audit Bot', number: 1, text: 'Security concern: GraphQL introspection can expose schema details. We\'d need to disable it in production and implement query depth limiting.', timestamp: '2026-03-05T14:02:00Z' },
      { emoji: '📋', name: 'Dispatch Bot', number: 1, text: 'Migration would impact 12 downstream integrations. I recommend a phased approach — run both in parallel for 90 days.', timestamp: '2026-03-05T14:04:00Z' },
      { emoji: '🤖', name: 'Agent Alpha', number: 2, text: 'Agreed on phased approach. I can set up Apollo Federation to wrap existing REST endpoints first.', timestamp: '2026-03-05T14:06:00Z' },
      { emoji: '🛡️', name: 'Audit Bot', number: 2, text: 'I\'ll prepare a security checklist for the GraphQL layer. Persisted queries would mitigate most injection risks.', timestamp: '2026-03-05T14:08:00Z' },
    ],
  },
  {
    id: 'c2',
    question: 'What\'s our strategy for handling the increased error rate on the payments service?',
    status: 'active',
    participants: [
      { emoji: '🤖', name: 'Agent Alpha', sent: 2, limit: 3, status: 'pending' },
      { emoji: '🛡️', name: 'Audit Bot', sent: 1, limit: 3, status: 'speaking' },
      { emoji: '📋', name: 'Dispatch Bot', sent: 1, limit: 3, status: 'pending' },
    ],
    messages: [
      { emoji: '🤖', name: 'Agent Alpha', number: 1, text: 'Error rate spiked to 2.3% after the v2.2 deploy. Root cause: Stripe webhook timeout on high-volume batches.', timestamp: '2026-03-06T10:00:00Z' },
      { emoji: '📋', name: 'Dispatch Bot', number: 1, text: 'I\'ve escalated this to P1. Customer support has received 8 tickets in the last hour about failed payments.', timestamp: '2026-03-06T10:03:00Z' },
      { emoji: '🛡️', name: 'Audit Bot', number: 1, text: 'Reviewing the deployment diff now. The webhook handler was changed to synchronous processing — that\'s the bottleneck.', timestamp: '2026-03-06T10:05:00Z' },
      { emoji: '🤖', name: 'Agent Alpha', number: 2, text: 'I can revert the webhook handler to async with a queue. ETA: 20 minutes for the fix, 10 for deployment.', timestamp: '2026-03-06T10:07:00Z' },
    ],
  },
];

export const meetings: Meeting[] = [
  {
    id: 'm1', type: 'meeting', title: 'Weekly Standup with Engineering', date: '2026-03-06T10:00:00Z',
    duration_minutes: 30, duration_display: '30m', attendees: ['Alice', 'Bob', 'Charlie'],
    summary: '**Sprint Progress Update**\n\nDiscussed sprint progress. Backend API is 80% complete. Frontend team blocked on design tokens.\n\n- Alice: Completing auth module by EOD\n- Bob: Database migration tested successfully\n- Charlie: Need design review for new dashboard',
    action_items: [
      { task: 'Review PR #42', assignee: 'Alice', done: false },
      { task: 'Update API docs', assignee: 'Bob', done: true },
    ],
    ai_insights: '30 min meeting with 3 attendees — focused and efficient', meeting_type: 'standup',
    sentiment: 'positive', has_external_participants: false, external_domains: [],
    fathom_url: null, share_url: null,
  },
  {
    id: 'm2', type: 'meeting', title: 'Morning Standup — Platform Team', date: '2026-03-05T09:00:00Z',
    duration_minutes: 15, duration_display: '15m', attendees: ['Dana', 'Eve', 'Frank'],
    summary: 'Quick sync on platform stability. No blockers. Monitoring dashboard update deployed.',
    action_items: [], ai_insights: '15 min standup — no blockers reported',
    meeting_type: 'standup', sentiment: 'positive', has_external_participants: false,
    external_domains: [], fathom_url: null, share_url: null,
  },
  {
    id: 'm3', type: 'meeting', title: 'Sales Demo — Acme Corp', date: '2026-03-05T14:00:00Z',
    duration_minutes: 45, duration_display: '45m', attendees: ['Grace', 'Hank', 'John (Acme)'],
    summary: '**Acme Corp Demo**\n\nPresented enterprise features. Strong interest in SSO and audit logging. Follow-up scheduled for next week.',
    action_items: [
      { task: 'Send pricing proposal', assignee: 'Grace', done: false },
      { task: 'Prepare SSO integration docs', assignee: 'Hank', done: false },
    ],
    ai_insights: '45 min sales demo — high engagement from prospect',
    meeting_type: 'sales', sentiment: 'positive', has_external_participants: true,
    external_domains: ['acme.com'], fathom_url: 'https://fathom.video/demo1', share_url: 'https://share.link/demo1',
  },
  {
    id: 'm4', type: 'meeting', title: 'Sales Call — Widget Inc Follow-up', date: '2026-03-04T11:00:00Z',
    duration_minutes: 30, duration_display: '30m', attendees: ['Grace', 'Sam (Widget)'],
    summary: 'Follow-up on Widget Inc proposal. They want custom reporting. Budget approved internally.',
    action_items: [
      { task: 'Draft custom reporting SOW', assignee: 'Grace', done: false },
    ],
    ai_insights: '30 min follow-up — deal likely to close this quarter',
    meeting_type: 'sales', sentiment: 'positive', has_external_participants: true,
    external_domains: ['widget.io'], fathom_url: null, share_url: null,
  },
  {
    id: 'm5', type: 'meeting', title: 'Engineering Interview — Senior Backend', date: '2026-03-04T15:00:00Z',
    duration_minutes: 60, duration_display: '1h', attendees: ['Alice', 'Bob', 'Candidate X'],
    summary: 'Technical interview for senior backend role. Strong system design answers. Coding exercise completed well.',
    action_items: [
      { task: 'Submit interview scorecard', assignee: 'Alice', done: true },
      { task: 'Schedule final round', assignee: 'Bob', done: false },
    ],
    ai_insights: '1h interview — candidate scored 4.2/5 on technical assessment',
    meeting_type: 'external', sentiment: 'positive', has_external_participants: true,
    external_domains: [], fathom_url: null, share_url: null,
  },
  {
    id: 'm6', type: 'meeting', title: 'All-Hands Q1 Review', date: '2026-03-03T16:00:00Z',
    duration_minutes: 90, duration_display: '1h 30m', attendees: ['CEO', 'Alice', 'Bob', 'Charlie', 'Dana', 'Eve', 'Frank', 'Grace'],
    summary: '**Q1 All-Hands**\n\nRevenue up 23% QoQ. New product launch on track. Hiring 5 more engineers.',
    action_items: [
      { task: 'Share Q1 deck with team', assignee: 'CEO', done: true },
    ],
    ai_insights: '90 min all-hands — 8 attendees, positive company outlook',
    meeting_type: 'team', sentiment: 'positive', has_external_participants: false,
    external_domains: [], fathom_url: null, share_url: null,
  },
  {
    id: 'm7', type: 'meeting', title: '1-on-1: Alice ↔ Bob', date: '2026-03-03T11:00:00Z',
    duration_minutes: 25, duration_display: '25m', attendees: ['Alice', 'Bob'],
    summary: 'Career growth discussion. Bob interested in tech lead track. Agreed on mentorship plan.',
    action_items: [
      { task: 'Create development plan for Bob', assignee: 'Alice', done: false },
    ],
    ai_insights: '25 min 1-on-1 — career development focused',
    meeting_type: '1-on-1', sentiment: 'positive', has_external_participants: false,
    external_domains: [], fathom_url: null, share_url: null,
  },
  {
    id: 'm8', type: 'meeting', title: '1-on-1: Charlie ↔ Dana', date: '2026-03-02T14:00:00Z',
    duration_minutes: 30, duration_display: '30m', attendees: ['Charlie', 'Dana'],
    summary: 'Discussed project handoff process. Dana taking over dashboard redesign. Knowledge transfer planned.',
    action_items: [
      { task: 'Document dashboard architecture', assignee: 'Charlie', done: false },
      { task: 'Set up access to design files', assignee: 'Dana', done: true },
    ],
    ai_insights: '30 min 1-on-1 — smooth handoff planning',
    meeting_type: '1-on-1', sentiment: 'neutral', has_external_participants: false,
    external_domains: [], fathom_url: null, share_url: null,
  },
  {
    id: 'm9', type: 'meeting', title: 'Sprint Planning — Q2 Kickoff', date: '2026-03-02T10:00:00Z',
    duration_minutes: 60, duration_display: '1h', attendees: ['Alice', 'Bob', 'Charlie', 'Eve'],
    summary: '**Q2 Sprint Planning**\n\nPrioritized 24 stories. Estimated velocity: 48 points. Key focus: performance improvements and new integrations.',
    action_items: [
      { task: 'Create JIRA epics for Q2', assignee: 'Alice', done: false },
      { task: 'Assign stories to sprints', assignee: 'Eve', done: false },
    ],
    ai_insights: '1h planning session — 24 stories prioritized, 48 point velocity',
    meeting_type: 'planning', sentiment: 'positive', has_external_participants: false,
    external_domains: [], fathom_url: null, share_url: null,
  },
  {
    id: 'm10', type: 'meeting', title: 'Team Retro — Sprint 14', date: '2026-03-01T15:00:00Z',
    duration_minutes: 45, duration_display: '45m', attendees: ['Alice', 'Bob', 'Charlie', 'Dana', 'Frank'],
    summary: 'Sprint retro. What went well: deployment automation. What to improve: code review turnaround time.',
    action_items: [
      { task: 'Set up code review SLA alerts', assignee: 'Frank', done: false },
    ],
    ai_insights: '45 min retro — 5 attendees, constructive feedback on review process',
    meeting_type: 'team', sentiment: 'neutral', has_external_participants: false,
    external_domains: [], fathom_url: null, share_url: null,
  },
];

export const activityFeed: ActivityEvent[] = [
  { id: 'a1', agentEmoji: '🤖', agentName: 'Agent Alpha', action: 'Merged PR #847 — auth service refactor', timestamp: '2026-03-06T09:50:00Z' },
  { id: 'a2', agentEmoji: '🛡️', agentName: 'Audit Bot', action: 'Completed security scan on v2.3 build', timestamp: '2026-03-06T09:45:00Z' },
  { id: 'a3', agentEmoji: '📋', agentName: 'Dispatch Bot', action: 'Routed 3 support tickets to engineering queue', timestamp: '2026-03-06T09:30:00Z' },
  { id: 'a4', agentEmoji: '🤖', agentName: 'Agent Alpha', action: 'Optimized SQL query — p95 latency reduced 34%', timestamp: '2026-03-06T09:15:00Z' },
  { id: 'a5', agentEmoji: '🛡️', agentName: 'Audit Bot', action: 'Flagged 2 vulnerable dependencies in package.json', timestamp: '2026-03-06T08:45:00Z' },
  { id: 'a6', agentEmoji: '📋', agentName: 'Dispatch Bot', action: 'Generated daily standup summary for #engineering', timestamp: '2026-03-06T08:30:00Z' },
  { id: 'a7', agentEmoji: '🤖', agentName: 'Agent Alpha', action: 'Deployed hotfix v2.2.1 to production', timestamp: '2026-03-06T08:00:00Z' },
  { id: 'a8', agentEmoji: '🛡️', agentName: 'Audit Bot', action: 'Published GDPR compliance checklist update', timestamp: '2026-03-06T07:30:00Z' },
];
