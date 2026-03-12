import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, BookOpen, Key, Terminal, Users, Bot, FileText, Phone, Mail, Target, Zap } from 'lucide-react';
import {
  createHuman,
  fetchAgents,
  fetchHumans,
  fetchIntegrationDoc,
  registerAgent,
  upsertIntegrationDoc,
} from '@/features/platform/api';

const DOC_SLUG = 'kanban-api';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const WEBHOOK_SECRET = import.meta.env.VITE_AGENT_COMMAND_WEBHOOK_SECRET || '';
const AGENT_API_URL = import.meta.env.VITE_AGENT_COMMAND_API_URL || `${SUPABASE_URL}/functions/v1/ai-tasks`;

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
      title={`Copy ${label || 'value'}`}
    >
      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
      {copied ? 'Copied' : (label || 'Copy')}
    </button>
  );
}

function EnvVarRow({ name, value, secret }: { name: string; value: string; secret?: boolean }) {
  const display = secret ? value.slice(0, 12) + '...' + value.slice(-6) : value;
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-black/30 border border-white/5 font-mono text-sm group">
      <span className="text-primary/80 shrink-0">{name}=</span>
      <span className="text-zinc-300 truncate flex-1">{display || '(not set)'}</span>
      <CopyButton value={`${name}=${value}`} label="Copy" />
    </div>
  );
}

function CodeBlock({ title, code, language }: { title: string; code: string; language?: string }) {
  return (
    <div className="rounded-lg border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10">
        <span className="text-xs text-muted-foreground font-mono">{language || 'bash'}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{title}</span>
          <CopyButton value={code} />
        </div>
      </div>
      <pre className="p-3 text-sm font-mono text-zinc-300 overflow-x-auto whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

const IntegrationGuide = () => {
  const queryClient = useQueryClient();

  const { data: humans = [] } = useQuery({ queryKey: ['humans'], queryFn: fetchHumans });
  const { data: agents = [] } = useQuery({ queryKey: ['agents'], queryFn: fetchAgents });
  const { data: doc } = useQuery({ queryKey: ['integration-doc', DOC_SLUG], queryFn: () => fetchIntegrationDoc(DOC_SLUG) });

  const [humanName, setHumanName] = useState('');
  const [humanRole, setHumanRole] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentEmoji, setAgentEmoji] = useState('');
  const [docTitle, setDocTitle] = useState('Kanban Board API Documentation');
  const [docContent, setDocContent] = useState('');
  const [activeTab, setActiveTab] = useState<'api' | 'registry' | 'docs'>('api');

  const fullGuideText = `# Agent Command Hub — Integration Guide

## Environment Variables

AGENT_COMMAND_API_URL=${AGENT_API_URL}
AGENT_COMMAND_WEBHOOK_SECRET=${WEBHOOK_SECRET}
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

## API Endpoint

All task operations use a single POST endpoint:

POST ${AGENT_API_URL}
Content-Type: application/json
x-webhook-secret: ${WEBHOOK_SECRET}

## Actions

### list — List Tasks

{ "action": "list" }
{ "action": "list", "column": "to_do" }
{ "action": "list", "agent_name": "Rei", "priority": "high" }

Column values: todo, to_do, doing, in_progress, needs_input, done, canceled

### create — Create Task

{
  "action": "create",
  "title": "Build the landing page",
  "priority": "high",
  "column": "to_do",
  "agent_name": "YourAgent",
  "agent_emoji": "🤖",
  "assigned_to": "Rei"
}

Priority: low, medium, high, urgent

### update — Update Task

{
  "action": "update",
  "task_id": "uuid",
  "column": "doing",
  "title": "New title",
  "priority": "urgent"
}

### move — Move Task to Column

{
  "action": "move",
  "task_id": "uuid",
  "column": "done"
}

### assign — Assign Task

{
  "action": "assign",
  "task_id": "uuid",
  "assigned_to": ["Rei", "Kira"],
  "agent_name": "YourAgent",
  "agent_emoji": "🤖"
}

### delete — Delete Task

{ "action": "delete", "task_id": "uuid" }

### upload_report — Upload HTML Report

IMPORTANT: html_content must be a FULLY SELF-CONTAINED HTML file.
- Inline all CSS: replace <link href="styles.css"> with <style>...</style>
- Inline all JS: replace <script src="app.js"> with <script>...</script>
- External CDN links (Google Fonts, etc.) are OK
- Do NOT use relative file references — they will not resolve

{
  "action": "upload_report",
  "task_id": "uuid",
  "html_content": "<html>...</html>",
  "title": "Optional override title"
}

### list_reports — List Reports

{ "action": "list_reports" }
{ "action": "list_reports", "task_id": "uuid" }

### complete — Complete Task + Upload Report (Preferred)

{
  "action": "complete",
  "task_id": "uuid",
  "html_content": "<html>...</html>"
}

Moves task to done AND uploads the report in one call.
Use this instead of "move" to done.

## Full curl Example

curl -X POST "${AGENT_API_URL}" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${WEBHOOK_SECRET}" \\
  -d '{
    "action": "create",
    "title": "Deploy v2 to production",
    "priority": "high",
    "agent_name": "DeployBot",
    "agent_emoji": "🚀"
  }'

## Minimal Node.js Agent

const API_URL = process.env.AGENT_COMMAND_API_URL;
const SECRET = process.env.AGENT_COMMAND_WEBHOOK_SECRET;

async function createTask(title, priority = 'medium') {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': SECRET,
    },
    body: JSON.stringify({
      action: 'create',
      title,
      priority,
      agent_name: 'MyAgent',
      agent_emoji: '🤖',
    }),
  });
  return res.json();
}

async function moveTask(taskId, column) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': SECRET,
    },
    body: JSON.stringify({
      action: 'move',
      task_id: taskId,
      column,
    }),
  });
  return res.json();
}

## Identity API (Supabase REST)

Card types: soul, identity, user, memory, agents, tools, heartbeat

GET /rest/v1/agent_identity_cards?agent_id=eq.AGENT_UUID
PATCH /rest/v1/agent_identity_cards?agent_id=eq.AGENT_UUID&card_type=eq.soul
  Body: {"content_md": "...", "updated_by": "Rei"}

GET /rest/v1/agent_daily_logs?agent_id=eq.AGENT_UUID&order=log_date.desc
POST /rest/v1/agent_daily_logs
  Body: {"agent_id": "UUID", "log_date": "2026-03-11", "title": "...", "content_md": "...", "written_by": "Rei"}
PATCH /rest/v1/agent_daily_logs?id=eq.LOG_UUID
  Body: {"content_md": "...", "title": "..."}

## Reports API (Supabase REST)

Upload HTML reports/files when a task is completed.

IMPORTANT: html_content must be FULLY SELF-CONTAINED HTML.
- Inline all CSS: use <style> tags, NOT <link href="styles.css">
- Inline all JS: use <script> blocks, NOT <script src="app.js">
- External CDN links (Google Fonts, CDN libraries) are OK
- Relative file references will NOT resolve in the viewer

POST /rest/v1/reports
  Body: {
    "task_id": "TASK_UUID",
    "title": "Task Name as Report Title",
    "html_content": "<html>...</html>",
    "uploaded_by": "Rei",
    "agent_name": "Rei",
    "agent_emoji": "🦐"
  }

GET /rest/v1/reports?order=created_at.desc&limit=50
GET /rest/v1/reports?task_id=eq.TASK_UUID

## AI Log API (Supabase REST)

Structured activity log for all agents. Use this to record task_start/task_end events, heartbeats, observations, and general messages.

Categories: observation, general, reminder, fyi, heartbeat, task_start, task_end

POST /rest/v1/ai_logs
  Body: {
    "agent_name": "Rei",
    "agent_emoji": "🦐",
    "message": "Starting work on landing page redesign",
    "category": "task_start",
    "metadata": {"task_id": "TASK_UUID"}
  }

GET /rest/v1/ai_logs?order=created_at.desc&limit=50

### Heartbeat (every ~30 minutes)

POST /rest/v1/ai_logs
  Body: {
    "agent_name": "Rei",
    "agent_emoji": "🦐",
    "message": "Daemon online. Polling for tasks.",
    "category": "heartbeat"
  }

### Task Start / Task End

POST /rest/v1/ai_logs
  Body: {
    "agent_name": "Rei",
    "agent_emoji": "🦐",
    "message": "Started: Build landing page",
    "category": "task_start",
    "metadata": {"task_id": "uuid"}
  }

POST /rest/v1/ai_logs
  Body: {
    "agent_name": "Rei",
    "agent_emoji": "🦐",
    "message": "Completed: Build landing page",
    "category": "task_end",
    "metadata": {"task_id": "uuid"}
  }

---

## Lexa AI Phone API

Base URL: {SUPABASE_URL}/functions/v1/lexa-api
Auth: x-webhook-secret header (same secret as ai-tasks)
Method: POST with JSON body containing "action" field

### Place a Call
POST /functions/v1/lexa-api
  Headers: { "x-webhook-secret": "YOUR_SECRET", "Content-Type": "application/json" }
  Body: {
    "action": "call",
    "to_phone": "+1234567890",
    "from_phone": "+1987654321",
    "agent_name": "Bujji",
    "prompt": "You are calling to confirm an appointment...",
    "first_message": "Hey! This is Bujji calling about your appointment.",
    "lead_id": "uuid (optional - auto-injects lead name/email into context)",
    "campaign_id": "uuid (optional)",
    "disable_tools": false,
    "metadata": {}
  }
  Response: { "success": true, "call_id": "...", "session_id": "...", "call": {...} }

  Notes:
  - When lead_id is provided, lead name/email/company are auto-injected into call metadata
  - Email function (send_email) is automatically enabled - the agent can send emails mid-call via AgentMail
  - Set "disable_tools": true to disable mid-call functions
  - You can also pass custom "tools" array to add extra Millis function-calling tools

### List Calls
  Body: { "action": "list_calls", "status": "completed", "agent_name": "Rei", "limit": 50 }

### Get Call
  Body: { "action": "get_call", "session_id": "..." }

### Leads CRUD
  Create: { "action": "create_lead", "name": "John Doe", "phone": "+1234567890", "email": "john@example.com", "company": "Acme", "tags": ["prospect"] }
  Update: { "action": "update_lead", "lead_id": "uuid", "status": "qualified" }
  List:   { "action": "list_leads", "status": "new" }
  Delete: { "action": "delete_lead", "lead_id": "uuid" }

### Campaigns
  Create:  { "action": "create_campaign", "name": "Q1 Outreach", "agent_prompt": "...", "from_phone": "+1..." }
  Update:  { "action": "update_campaign", "campaign_id": "uuid", "status": "running" }
  List:    { "action": "list_campaigns" }
  Run:     { "action": "run_campaign", "campaign_id": "uuid" }
  Pause:   { "action": "pause_campaign", "campaign_id": "uuid" }

### Metrics
  Body: { "action": "metrics", "from_date": "2026-03-01", "to_date": "2026-03-31" }

### Mid-Call Email (Automatic)
  The send_email tool is auto-injected into every call via Millis function calling.
  When the caller says "send me a link" or "email me", the agent calls the lexa-send-email edge function.
  If the lead has an email on file, it sends automatically without asking.
  Emails are sent via AgentMail (bujji@agentmail.to) with branded HTML templates.

### Webhook (Millis callback)
  URL: {SUPABASE_URL}/functions/v1/lexa-webhook
  Millis sends post-call data (transcript, duration, cost, recording).
  Auto-updates call records, sentiment, and daily metrics.

---

## Nova AI SDR — Email & Prospecting API

Nova handles email campaigns, templates, sequences, and AI-powered lead generation.
Any agent can use Nova to find leads and launch email campaigns programmatically.

### Email API (Supabase REST)

Base: {SUPABASE_URL}/rest/v1
Headers: { "apikey": ANON_KEY, "Authorization": "Bearer ANON_KEY", "Content-Type": "application/json" }

#### Templates
  GET /rest/v1/nova_templates?is_active=eq.true&order=created_at.desc
  POST /rest/v1/nova_templates
    Body: { "name": "Cold Outreach v1", "subject": "Quick intro — {{company}}", "body_html": "<p>Hi {{name}}...</p>", "variables": ["name","company"], "category": "outreach", "tags": ["cold"] }

#### Sequences
  GET /rest/v1/nova_sequences?status=eq.active
  POST /rest/v1/nova_sequences
    Body: { "name": "3-Step Intro", "steps": [{"step":1,"template_id":"uuid","delay_days":0,"condition":"none"},{"step":2,"template_id":"uuid","delay_days":3,"condition":"no_reply"}] }

#### Campaigns
  GET /rest/v1/nova_campaigns?status=eq.active
  POST /rest/v1/nova_campaigns
    Body: { "name": "Q1 Law Firms", "from_address": "sender@domain.com", "sequence_id": "uuid", "total_leads": 50, "send_limit_per_day": 25, "timezone": "America/Vancouver" }
  PATCH /rest/v1/nova_campaigns?id=eq.UUID
    Body: { "status": "active" }

#### Send Emails
  POST /rest/v1/nova_emails
    Body: { "from_address": "sender@domain.com", "to_address": "lead@company.com", "to_name": "John", "subject": "Quick intro", "body_html": "<p>Hi John...</p>", "campaign_id": "uuid", "template_id": "uuid", "personalization_fields": {"name":"John","company":"Acme"} }

#### Daily Metrics
  GET /rest/v1/nova_daily_metrics?order=date.desc&limit=30

### Prospect / Lead Gen API

Base URL: {SUPABASE_URL}/functions/v1/nova-prospect
Auth: x-webhook-secret header
Method: POST with JSON body containing "action" field

Uses Kimi K2.5 AI to convert natural language to Google Maps search queries, then Apify to scrape matching businesses.

#### Preview Query (dry run — see what Kimi converts to)
  Body: { "action": "preview_query", "query": "personal injury lawyers in Miami FL" }
  Response: { "structured_query": { "searchTerms": ["personal injury lawyer","accident attorney"], "location": "Miami, FL", "maxResults": 50 } }

#### Create Prospect Campaign
  Body: { "action": "create_campaign", "name": "Miami Lawyers Q1", "query": "personal injury lawyers in Miami FL with good reviews", "description": "Testing Miami market", "max_results": 50 }
  Response: { "campaign": { "id": "uuid", "status": "draft", ... }, "structured_query": {...} }

#### Run Campaign (triggers Apify scraping)
  Body: { "action": "run_campaign", "campaign_id": "uuid" }
  Response: { "success": true, "run_id": "...", "total_found": 47, "imported": 42 }

#### List Leads
  Body: { "action": "list_leads", "campaign_id": "uuid", "status": "new", "category": "Lawyer" }
  Response: [ { "id": "uuid", "business_name": "Smith & Associates", "email": "info@smithlaw.com", "phone": "+1...", "category": "Lawyer", "city": "Miami", "rating": 4.8, "review_count": 127, ... } ]

#### Update Lead Status
  Body: { "action": "update_lead", "lead_id": "uuid", "status": "contacted", "tags": ["high-value"] }

#### Delete Lead
  Body: { "action": "delete_lead", "lead_id": "uuid" }

#### Export Leads for Email Campaign
  Body: { "action": "export_to_campaign", "campaign_id": "uuid" }
  Response: { "leads_with_email": 38, "leads": [{ "id":"...", "name":"Smith & Associates", "email":"info@smithlaw.com", "phone":"+1...", "company":"Smith & Associates", "category":"Lawyer", "city":"Miami", "state":"FL" }] }

### Agent Workflow: Prospect → Email Campaign

1. Create prospect campaign:
   POST nova-prospect { "action": "create_campaign", "name": "Miami Lawyers", "query": "personal injury lawyers Miami FL" }
2. Run scraping:
   POST nova-prospect { "action": "run_campaign", "campaign_id": "uuid" }
3. Export leads with emails:
   POST nova-prospect { "action": "export_to_campaign", "campaign_id": "uuid" }
4. Create email template:
   POST /rest/v1/nova_templates { "name": "...", "subject": "...", "body_html": "..." }
5. Create email campaign:
   POST /rest/v1/nova_campaigns { "name": "...", "from_address": "...", "template_id": "..." }
6. Send emails to exported leads:
   For each lead: POST /rest/v1/nova_emails { "to_address": lead.email, "to_name": lead.name, ... }

### Outbound Pipeline API (Automated Cold Email)

Base URL: {SUPABASE_URL}/functions/v1/nova-outbound
Auth: x-webhook-secret header
Method: POST with JSON body containing "action" field

End-to-end pipeline: research leads (Kimi K2.5) → draft personalized emails (Kimi K2.5) → QA scoring → auto/manual approve → send via Resend

#### Create Outbound Job (links prospect campaign to email campaign)
  Body: { "action": "create_job", "prospect_campaign_id": "uuid", "template_id": "uuid", "config": { "auto_approve_threshold": 0.7 } }
  Response: { "job": { "id": "uuid", "total_leads": 42, ... }, "email_campaign": { "id": "uuid", ... } }

#### Research Batch (AI scrapes websites + generates research briefs)
  Body: { "action": "research_batch", "job_id": "uuid", "batch_size": 5 }
  Response: { "researched": 5, "failed": 0, "results": [...] }

#### Draft Batch (AI generates personalized cold emails + QA scores)
  Body: { "action": "draft_batch", "job_id": "uuid", "batch_size": 5 }
  Response: { "drafted": 5, "auto_approved": 3, "needs_review": 2 }

#### Send Batch (sends approved drafts via Resend)
  Body: { "action": "send_batch", "job_id": "uuid", "batch_size": 10 }
  Response: { "sent_count": 10, "failed": 0 }

#### Run Full Pipeline (research → draft → send in one call)
  Body: { "action": "run_pipeline", "job_id": "uuid", "batch_size": 5 }
  Response: { "stages": { "research": {...}, "draft": {...}, "send": {...} } }

#### Review Queue (get leads needing manual approval)
  Body: { "action": "review_queue", "job_id": "uuid", "limit": 20 }

#### Approve / Reject Lead
  Body: { "action": "approve_lead", "lead_id": "uuid" }
  Body: { "action": "reject_lead", "lead_id": "uuid", "reason": "off-topic" }

#### Approve All Review Queue
  Body: { "action": "approve_all_review", "job_id": "uuid" }
`;

  const addHuman = useMutation({
    mutationFn: () => createHuman(humanName, humanRole),
    onSuccess: () => {
      setHumanName('');
      setHumanRole('');
      queryClient.invalidateQueries({ queryKey: ['humans'] });
    },
  });

  const addAgent = useMutation({
    mutationFn: () => registerAgent(agentName, agentEmoji),
    onSuccess: () => {
      setAgentName('');
      setAgentEmoji('');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  const saveDoc = useMutation({
    mutationFn: () => upsertIntegrationDoc(DOC_SLUG, docTitle, docContent, 'Rei'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integration-doc', DOC_SLUG] }),
  });

  useEffect(() => {
    if (doc) {
      setDocTitle(doc.title);
      setDocContent(doc.content_md);
    }
  }, [doc]);

  const tabs = [
    { id: 'api' as const, label: 'API Reference', icon: Terminal },
    { id: 'registry' as const, label: 'Registry', icon: Users },
    { id: 'docs' as const, label: 'Living Docs', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Tab navigation + Copy All */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 p-1 rounded-lg bg-zinc-900/50 border border-white/10 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary/15 text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
        <CopyButton value={fullGuideText} label="Copy Entire Guide" />
      </div>

      {/* API Reference Tab */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          {/* Environment Variables */}
          <section className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Key size={16} className="text-primary" />
              <h3 className="text-lg font-semibold">Environment Variables</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Set these in your agent's <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">.env</code> or <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">.env.server</code> file to connect to Agent Command Hub.
            </p>
            <div className="space-y-2">
              <EnvVarRow name="AGENT_COMMAND_API_URL" value={AGENT_API_URL} />
              <EnvVarRow name="AGENT_COMMAND_WEBHOOK_SECRET" value={WEBHOOK_SECRET} secret />
              <EnvVarRow name="SUPABASE_URL" value={SUPABASE_URL} />
              <EnvVarRow name="SUPABASE_ANON_KEY" value={SUPABASE_ANON_KEY} secret />
            </div>
          </section>

          {/* API Endpoint Overview */}
          <section className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Terminal size={16} className="text-primary" />
              <h3 className="text-lg font-semibold">API Endpoints</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              All task operations go through the <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">POST /functions/v1/ai-tasks</code> Supabase edge function.
              Include the webhook secret in the <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">x-webhook-secret</code> header.
            </p>

            {/* Common headers */}
            <CodeBlock
              title="Required Headers"
              language="http"
              code={`POST $AGENT_COMMAND_API_URL
Content-Type: application/json
x-webhook-secret: $AGENT_COMMAND_WEBHOOK_SECRET`}
            />

            {/* List Tasks */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-mono">LIST</span>
                List Tasks
              </h4>
              <p className="text-xs text-muted-foreground">Retrieve tasks, optionally filtered by column.</p>
              <CodeBlock
                title="List all tasks"
                language="json"
                code={`{ "action": "list" }`}
              />
              <CodeBlock
                title="List tasks by column"
                language="json"
                code={`{ "action": "list", "column": "to_do" }

// Valid columns: todo, to_do, doing, in_progress,
// needs_input, done, canceled`}
              />
            </div>

            {/* Create Task */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs font-mono">CREATE</span>
                Create Task
              </h4>
              <p className="text-xs text-muted-foreground">Create a new task on the board.</p>
              <CodeBlock
                title="Create a task"
                language="json"
                code={`{
  "action": "create",
  "title": "Build the landing page",
  "priority": "high",
  "column": "to_do",
  "agent_name": "YourAgent",
  "agent_emoji": "🤖",
  "assigned_to": "Rei"
}

// Priority: low, medium, high, urgent`}
              />
            </div>

            {/* Update Task */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-mono">UPDATE</span>
                Update Task
              </h4>
              <p className="text-xs text-muted-foreground">Update a task's title, priority, or move it to a different column.</p>
              <CodeBlock
                title="Move task to doing"
                language="json"
                code={`{
  "action": "update",
  "task_id": "uuid-of-the-task",
  "column": "doing"
}`}
              />
              <CodeBlock
                title="Update title and priority"
                language="json"
                code={`{
  "action": "update",
  "task_id": "uuid-of-the-task",
  "title": "Updated task title",
  "priority": "urgent"
}`}
              />
            </div>

            {/* Move Task */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-xs font-mono">MOVE</span>
                Move Task
              </h4>
              <p className="text-xs text-muted-foreground">Move a task to a different column (shortcut for update with column).</p>
              <CodeBlock
                title="Move task to done"
                language="json"
                code={`{
  "action": "move",
  "task_id": "uuid-of-the-task",
  "column": "done"
}`}
              />
            </div>

            {/* Assign Task */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-xs font-mono">ASSIGN</span>
                Assign Task
              </h4>
              <p className="text-xs text-muted-foreground">Assign one or more people/agents to a task.</p>
              <CodeBlock
                title="Assign task"
                language="json"
                code={`{
  "action": "assign",
  "task_id": "uuid-of-the-task",
  "assigned_to": ["Rei", "Kira"],
  "agent_name": "YourAgent",
  "agent_emoji": "🤖"
}`}
              />
            </div>

            {/* Delete Task */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs font-mono">DELETE</span>
                Delete Task
              </h4>
              <p className="text-xs text-muted-foreground">Permanently remove a task from the board.</p>
              <CodeBlock
                title="Delete task"
                language="json"
                code={`{ "action": "delete", "task_id": "uuid-of-the-task" }`}
              />
            </div>

            {/* Upload Report */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-mono">UPLOAD_REPORT</span>
                Upload Report
              </h4>
              <p className="text-xs text-muted-foreground">Upload an HTML report linked to a completed task. Title, agent_name, and agent_emoji are auto-filled from the task if not provided.</p>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                <strong>⚠️ Important:</strong> The <code>html_content</code> must be a <strong>fully self-contained HTML file</strong>.
                Inline all CSS (<code>&lt;style&gt;</code> tags instead of <code>&lt;link href="styles.css"&gt;</code>) and
                all JS (<code>&lt;script&gt;</code> blocks instead of <code>&lt;script src="app.js"&gt;</code>).
                External CDN links (Google Fonts, etc.) are fine. Relative file references will NOT resolve.
              </div>
              <CodeBlock
                title="Upload a report"
                language="json"
                code={`{
  "action": "upload_report",
  "task_id": "uuid-of-the-task",
  "html_content": "<html>...</html>",
  "title": "Optional override title"
}`}
              />
            </div>

            {/* List Reports */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-400 text-xs font-mono">LIST_REPORTS</span>
                List Reports
              </h4>
              <p className="text-xs text-muted-foreground">List uploaded reports, optionally filtered by task or agent.</p>
              <CodeBlock
                title="List all reports"
                language="json"
                code={`{ "action": "list_reports" }`}
              />
              <CodeBlock
                title="List reports for a task"
                language="json"
                code={`{ "action": "list_reports", "task_id": "uuid-of-the-task" }`}
              />
            </div>

            {/* Complete Task */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-lime-500/20 text-lime-400 text-xs font-mono">COMPLETE</span>
                Complete Task + Upload Report
              </h4>
              <p className="text-xs text-muted-foreground">Convenience action: moves task to "done" AND uploads the HTML report in one call. <strong>Preferred over using "move" to done.</strong></p>
              <CodeBlock
                title="Complete task with report"
                language="json"
                code={`{
  "action": "complete",
  "task_id": "uuid-of-the-task",
  "html_content": "<html>...</html>"
}`}
              />
            </div>

            {/* Full curl example */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-zinc-500/20 text-zinc-400 text-xs font-mono">CURL</span>
                Full Example
              </h4>
              <CodeBlock
                title="Complete curl example"
                language="bash"
                code={`curl -X POST "$AGENT_COMMAND_API_URL" \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: $AGENT_COMMAND_WEBHOOK_SECRET" \\
  -d '{
    "action": "create",
    "title": "Deploy v2 to production",
    "priority": "high",
    "agent_name": "DeployBot",
    "agent_emoji": "🚀"
  }'`}
              />
            </div>
          </section>

          {/* Agent Setup Quick Start */}
          <section className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Bot size={16} className="text-primary" />
              <h3 className="text-lg font-semibold">Agent Quick Start</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Add these to your AI agent's environment and use the payloads above to interact with the task board.
            </p>
            <CodeBlock
              title=".env.server"
              language="env"
              code={`AGENT_COMMAND_API_URL=${AGENT_API_URL}
AGENT_COMMAND_WEBHOOK_SECRET=${WEBHOOK_SECRET || 'your-webhook-secret-here'}`}
            />
            <CodeBlock
              title="Minimal Node.js agent"
              language="javascript"
              code={`const API_URL = process.env.AGENT_COMMAND_API_URL;
const SECRET = process.env.AGENT_COMMAND_WEBHOOK_SECRET;

async function send(payload) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': SECRET,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// Create a task
await send({
  action: 'create',
  title: 'Build landing page',
  priority: 'high',
  agent_name: 'MyAgent',
  agent_emoji: '🤖',
});

// Move a task
await send({
  action: 'move',
  task_id: 'uuid',
  column: 'done',
});`}
            />
          </section>

          {/* Identity API */}
          <section className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={16} className="text-primary" />
              <h3 className="text-lg font-semibold">Identity API (Supabase REST)</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Agents can read and update their soul, identity cards, and daily memory logs using the standard Supabase REST API.
              Use the <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">apikey</code> header with your anon key.
            </p>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-mono">GET</span>
                Read Identity Cards
              </h4>
              <CodeBlock
                title="Get all cards for an agent"
                language="bash"
                code={`curl "${SUPABASE_URL}/rest/v1/agent_identity_cards?agent_id=eq.AGENT_UUID&select=*" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"`}
              />
              <CodeBlock
                title="Get a specific card (e.g. soul)"
                language="bash"
                code={`curl "${SUPABASE_URL}/rest/v1/agent_identity_cards?agent_id=eq.AGENT_UUID&card_type=eq.soul&select=*" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"`}
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-mono">PATCH</span>
                Update Identity Card
              </h4>
              <CodeBlock
                title="Update card content"
                language="bash"
                code={`curl -X PATCH "${SUPABASE_URL}/rest/v1/agent_identity_cards?agent_id=eq.AGENT_UUID&card_type=eq.soul" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"content_md": "# Soul\\nI am Rei...", "updated_by": "Rei"}'`}
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-mono">GET</span>
                Read Daily Memory Logs
              </h4>
              <CodeBlock
                title="List daily logs (newest first)"
                language="bash"
                code={`curl "${SUPABASE_URL}/rest/v1/agent_daily_logs?agent_id=eq.AGENT_UUID&order=log_date.desc&limit=30" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"`}
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs font-mono">POST</span>
                Create Daily Log
              </h4>
              <CodeBlock
                title="Create a new daily log entry"
                language="bash"
                code={`curl -X POST "${SUPABASE_URL}/rest/v1/agent_daily_logs" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "AGENT_UUID",
    "log_date": "2026-03-11",
    "title": "Daily Log — March 11, 2026",
    "content_md": "## Sessions\\n- Built identity page...",
    "written_by": "Rei"
  }'`}
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-mono">PATCH</span>
                Update Daily Log
              </h4>
              <CodeBlock
                title="Update an existing log"
                language="bash"
                code={`curl -X PATCH "${SUPABASE_URL}/rest/v1/agent_daily_logs?id=eq.LOG_UUID" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"content_md": "Updated content...", "title": "Updated title"}'`}
              />
            </div>

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
              <strong className="text-primary">Card types:</strong> soul, identity, user, memory, agents, tools, heartbeat
            </div>
          </section>

          {/* Reports API */}
          <section className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} className="text-primary" />
              <h3 className="text-lg font-semibold">Reports API (Supabase REST)</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload HTML reports or files when a task is completed. Use the task name as the report title and link it to the task via <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">task_id</code>.
            </p>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              <strong>⚠️ Critical:</strong> Reports are rendered in a sandboxed iframe. The HTML must be <strong>fully self-contained</strong> — inline all CSS and JS.
              Do NOT reference external files like <code>styles.css</code> or <code>app.js</code>. External CDN links (fonts, libraries) are OK.
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs font-mono">POST</span>
                Upload Report
              </h4>
              <CodeBlock
                title="Upload HTML report for a completed task"
                language="bash"
                code={`curl -X POST "${SUPABASE_URL}/rest/v1/reports" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "task_id": "COMPLETED_TASK_UUID",
    "title": "Task Name as Report Title",
    "html_content": "<html>...</html>",
    "uploaded_by": "Rei",
    "agent_name": "Rei",
    "agent_emoji": "🦐"
  }'`}
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-mono">GET</span>
                List Reports
              </h4>
              <CodeBlock
                title="List all reports (newest first)"
                language="bash"
                code={`curl "${SUPABASE_URL}/rest/v1/reports?order=created_at.desc&limit=50" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"`}
              />
              <CodeBlock
                title="Get reports for a specific task"
                language="bash"
                code={`curl "${SUPABASE_URL}/rest/v1/reports?task_id=eq.TASK_UUID" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"`}
              />
            </div>
          </section>

          {/* AI Log API */}
          <section className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Terminal size={16} className="text-primary" />
              <h3 className="text-lg font-semibold">AI Log API (Supabase REST)</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Structured activity log for all agents. Record task starts/ends, heartbeats, observations, and general messages.
              Categories: <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">observation</code>,{' '}
              <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">general</code>,{' '}
              <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">reminder</code>,{' '}
              <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">fyi</code>,{' '}
              <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">heartbeat</code>,{' '}
              <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">task_start</code>,{' '}
              <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">task_end</code>
            </p>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs font-mono">POST</span>
                Create Log Entry
              </h4>
              <CodeBlock
                title="Log a task start"
                language="bash"
                code={`curl -X POST "${SUPABASE_URL}/rest/v1/ai_logs" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_name": "Rei",
    "agent_emoji": "🦐",
    "message": "Started: Build landing page",
    "category": "task_start",
    "metadata": {"task_id": "uuid-of-the-task"}
  }'`}
              />
              <CodeBlock
                title="Log a heartbeat"
                language="bash"
                code={`curl -X POST "${SUPABASE_URL}/rest/v1/ai_logs" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_name": "Rei",
    "agent_emoji": "🦐",
    "message": "Daemon online. Polling for tasks.",
    "category": "heartbeat"
  }'`}
              />
              <CodeBlock
                title="Log task completion"
                language="bash"
                code={`curl -X POST "${SUPABASE_URL}/rest/v1/ai_logs" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_name": "Rei",
    "agent_emoji": "🦐",
    "message": "Completed: Build landing page",
    "category": "task_end",
    "metadata": {"task_id": "uuid-of-the-task"}
  }'`}
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-mono">GET</span>
                Read Log Entries
              </h4>
              <CodeBlock
                title="List recent log entries"
                language="bash"
                code={`curl "${SUPABASE_URL}/rest/v1/ai_logs?order=created_at.desc&limit=50" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"`}
              />
              <CodeBlock
                title="Filter by category"
                language="bash"
                code={`curl "${SUPABASE_URL}/rest/v1/ai_logs?category=eq.heartbeat&order=created_at.desc&limit=20" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"`}
              />
            </div>

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
              <strong className="text-primary">Best practices:</strong> Log a <code>heartbeat</code> every ~30 minutes.
              Log <code>task_start</code> when beginning work and <code>task_end</code> when finishing.
              Include <code>task_id</code> in metadata to link log entries to kanban tasks.
            </div>
          </section>

          {/* Lexa AI Phone API */}
          <section className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-teal-400" />
              <h3 className="text-lg font-semibold">Lexa AI Phone API</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">Edge Function</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Place outbound voice calls, manage leads and campaigns via the Lexa edge function.
              Base URL: <code className="text-xs bg-secondary/30 px-1 py-0.5 rounded">{'{SUPABASE_URL}'}/functions/v1/lexa-api</code>
            </p>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs font-mono">POST</span>
                Place a Call
              </h4>
              <CodeBlock
                title="Place outbound call with email function"
                language="bash"
                code={`curl -X POST "${SUPABASE_URL}/functions/v1/lexa-api" \\
  -H "x-webhook-secret: $WEBHOOK_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "call",
    "to_phone": "+1234567890",
    "from_phone": "+1987654321",
    "agent_name": "Bujji",
    "prompt": "You are calling to confirm an appointment tomorrow at 2pm. If they want details, use send_email.",
    "first_message": "Hey! This is Bujji calling about your appointment tomorrow.",
    "lead_id": "uuid-of-lead"
  }'`}
              />
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Auto-enabled:</strong> Mid-call email via AgentMail. When the caller says "send me a link" or "email me",
                the agent sends a branded email instantly. If <code>lead_id</code> is provided, the lead's email is used automatically.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs font-mono">POST</span>
                Manage Leads
              </h4>
              <CodeBlock
                title="Create a lead"
                language="bash"
                code={`curl -X POST "${SUPABASE_URL}/functions/v1/lexa-api" \\
  -H "x-webhook-secret: $WEBHOOK_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "create_lead",
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com",
    "company": "Acme Corp",
    "tags": ["prospect", "q1"]
  }'`}
              />
              <CodeBlock
                title="List leads"
                language="bash"
                code={`curl -X POST "${SUPABASE_URL}/functions/v1/lexa-api" \\
  -H "x-webhook-secret: $WEBHOOK_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{"action": "list_leads", "status": "new"}'`}
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs font-mono">POST</span>
                Campaigns
              </h4>
              <CodeBlock
                title="Create and run a campaign"
                language="bash"
                code={`# Create campaign
curl -X POST "${SUPABASE_URL}/functions/v1/lexa-api" \\
  -H "x-webhook-secret: $WEBHOOK_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "create_campaign",
    "name": "Q1 Outreach",
    "agent_prompt": "You are an AI assistant calling to schedule a demo...",
    "from_phone": "+1987654321"
  }'

# Start campaign
curl -X POST "${SUPABASE_URL}/functions/v1/lexa-api" \\
  -H "x-webhook-secret: $WEBHOOK_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{"action": "run_campaign", "campaign_id": "uuid"}'`}
              />
            </div>

            <div className="p-3 rounded-lg bg-teal-500/5 border border-teal-500/20 text-xs text-muted-foreground space-y-1">
              <div>
                <strong className="text-teal-400">Available actions:</strong>{' '}
                <code>call</code>, <code>list_calls</code>, <code>get_call</code>,{' '}
                <code>create_lead</code>, <code>update_lead</code>, <code>list_leads</code>, <code>delete_lead</code>,{' '}
                <code>create_campaign</code>, <code>update_campaign</code>, <code>list_campaigns</code>,{' '}
                <code>run_campaign</code>, <code>pause_campaign</code>, <code>metrics</code>.
              </div>
              <div>
                <strong className="text-teal-400">Mid-call tools:</strong>{' '}
                <code>send_email</code> is auto-injected into every call. The agent can send branded emails via AgentMail during live calls.
                Pass <code>"disable_tools": true</code> in the call payload to disable.
              </div>
              <div>
                The webhook at <code>/functions/v1/lexa-webhook</code> receives Millis AI post-call callbacks automatically.
              </div>
            </div>
          </section>

          {/* Nova AI SDR — Email & Prospecting API */}
          <section className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-pink-400" />
              <h3 className="text-lg font-semibold">Nova AI SDR — Email & Prospecting API</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">Edge Function + REST</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered lead generation (Apify + Kimi K2.5) and email campaign management.
              Any agent can prospect for leads and launch email campaigns.
            </p>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Target size={14} className="text-teal-400" />
                Prospect Campaign — Full Workflow
              </h4>
              <CodeBlock
                title="1. Create prospect campaign (natural language → search queries)"
                language="bash"
                code={`curl -X POST "${SUPABASE_URL}/functions/v1/nova-prospect" \\
  -H "x-webhook-secret: $WEBHOOK_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "create_campaign",
    "name": "Miami Lawyers Q1",
    "query": "personal injury lawyers in Miami FL with good reviews",
    "max_results": 50
  }'`}
              />
              <CodeBlock
                title="2. Run scraping (Apify Google Maps)"
                language="bash"
                code={`curl -X POST "${SUPABASE_URL}/functions/v1/nova-prospect" \\
  -H "x-webhook-secret: $WEBHOOK_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{"action": "run_campaign", "campaign_id": "uuid"}'
# Response: { "success": true, "total_found": 47, "imported": 42 }`}
              />
              <CodeBlock
                title="3. Export leads with emails for campaign use"
                language="bash"
                code={`curl -X POST "${SUPABASE_URL}/functions/v1/nova-prospect" \\
  -H "x-webhook-secret: $WEBHOOK_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{"action": "export_to_campaign", "campaign_id": "uuid"}'
# Returns: { "leads_with_email": 38, "leads": [{name, email, phone, company, ...}] }`}
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Mail size={14} className="text-pink-400" />
                Send Emails (Supabase REST)
              </h4>
              <CodeBlock
                title="Send an email using a template"
                language="bash"
                code={`curl -X POST "${SUPABASE_URL}/rest/v1/nova_emails" \\
  -H "apikey: $SUPABASE_ANON_KEY" \\
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from_address": "mani@updates.verticalaisystems.com",
    "to_address": "lead@company.com",
    "to_name": "John",
    "subject": "Quick intro — Vertical AI",
    "body_html": "<p>Hi John, I noticed...</p>",
    "campaign_id": "uuid",
    "template_id": "uuid",
    "personalization_fields": {"name":"John","company":"Acme"}
  }'`}
              />
            </div>

            <div className="p-3 rounded-lg bg-pink-500/5 border border-pink-500/20 text-xs text-muted-foreground space-y-1">
              <div>
                <strong className="text-pink-400">Prospect actions:</strong>{' '}
                <code>create_campaign</code>, <code>run_campaign</code>, <code>preview_query</code>,{' '}
                <code>list_leads</code>, <code>update_lead</code>, <code>delete_lead</code>, <code>export_to_campaign</code>
              </div>
              <div>
                <strong className="text-pink-400">Email tables (REST):</strong>{' '}
                <code>nova_templates</code>, <code>nova_sequences</code>, <code>nova_campaigns</code>,{' '}
                <code>nova_emails</code>, <code>nova_daily_metrics</code>
              </div>
              <div>
                <strong className="text-pink-400">AI pipeline:</strong>{' '}
                Natural language → Kimi K2.5 → structured search queries → Apify Google Maps scraper → leads database → email campaigns
              </div>
            </div>

            {/* Outbound Pipeline API */}
            <div className="space-y-2 mt-6">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Zap size={14} className="text-orange-400" />
                Outbound Pipeline — Automated Cold Email
              </h4>
              <p className="text-xs text-muted-foreground">
                End-to-end pipeline: research leads → AI-draft personalized emails → QA scoring → approve → send.
                Base URL: <code>{SUPABASE_URL}/functions/v1/nova-outbound</code>
              </p>
              <CodeBlock
                title="1. Create outbound job (links prospect campaign → email campaign)"
                language="bash"
                code={`curl -X POST "${SUPABASE_URL}/functions/v1/nova-outbound" \\
  -H "x-webhook-secret: $WEBHOOK_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "create_job",
    "prospect_campaign_id": "uuid",
    "template_id": "uuid",
    "config": { "auto_approve_threshold": 0.7 }
  }'
# Response: { "job": { "id": "uuid", "total_leads": 42 }, "email_campaign": {...} }`}
              />
              <CodeBlock
                title="2. Run full pipeline (research → draft → send in one call)"
                language="bash"
                code={`curl -X POST "${SUPABASE_URL}/functions/v1/nova-outbound" \\
  -H "x-webhook-secret: $WEBHOOK_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{"action": "run_pipeline", "job_id": "uuid", "batch_size": 5}'
# Response: { "stages": { "research": {...}, "draft": {...}, "send": {...} } }`}
              />
              <CodeBlock
                title="Or step-by-step: research → draft → approve → send"
                language="bash"
                code={`# Research batch (AI scrapes websites + generates briefs via Kimi K2.5)
curl -X POST "${SUPABASE_URL}/functions/v1/nova-outbound" \\
  -H "x-webhook-secret: $WEBHOOK_SECRET" \\
  -d '{"action": "research_batch", "job_id": "uuid", "batch_size": 5}'

# Draft batch (AI generates personalized emails + QA scoring)
curl -X POST "${SUPABASE_URL}/functions/v1/nova-outbound" \\
  -H "x-webhook-secret: $WEBHOOK_SECRET" \\
  -d '{"action": "draft_batch", "job_id": "uuid", "batch_size": 5}'

# Approve all in review queue
curl -X POST "${SUPABASE_URL}/functions/v1/nova-outbound" \\
  -H "x-webhook-secret: $WEBHOOK_SECRET" \\
  -d '{"action": "approve_all_review", "job_id": "uuid"}'

# Send approved drafts via Resend
curl -X POST "${SUPABASE_URL}/functions/v1/nova-outbound" \\
  -H "x-webhook-secret: $WEBHOOK_SECRET" \\
  -d '{"action": "send_batch", "job_id": "uuid", "batch_size": 10}'`}
              />
            </div>

            <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20 text-xs text-muted-foreground space-y-1">
              <div>
                <strong className="text-orange-400">Outbound actions:</strong>{' '}
                <code>create_job</code>, <code>research_batch</code>, <code>draft_batch</code>,{' '}
                <code>send_batch</code>, <code>run_pipeline</code>, <code>review_queue</code>,{' '}
                <code>approve_lead</code>, <code>reject_lead</code>, <code>approve_all_review</code>,{' '}
                <code>get_job</code>, <code>list_jobs</code>
              </div>
              <div>
                <strong className="text-orange-400">Pipeline stages:</strong>{' '}
                pending → researched → review/approved → sent → replied
              </div>
              <div>
                <strong className="text-orange-400">Auto-approve:</strong>{' '}
                Drafts with QA score ≥ threshold go straight to approved. Below threshold → manual review queue.
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Registry Tab */}
      {activeTab === 'registry' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <section className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-primary" />
              <h3 className="text-lg font-semibold">People Registry</h3>
            </div>
            <div className="space-y-2 mb-4">
              <Input placeholder="Human name" value={humanName} onChange={(e) => setHumanName(e.target.value)} />
              <Input placeholder="Role (optional)" value={humanRole} onChange={(e) => setHumanRole(e.target.value)} />
              <Button onClick={() => addHuman.mutate()} disabled={!humanName.trim() || addHuman.isPending}>
                Add Human
              </Button>
            </div>
            <ul className="text-sm text-zinc-300 space-y-1">
              {humans.map((h) => (
                <li key={h.id} className="flex items-center gap-2 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                  {h.display_name}{h.role ? <span className="text-muted-foreground">— {h.role}</span> : ''}
                </li>
              ))}
              {humans.length === 0 && <li className="text-muted-foreground text-xs">No humans registered yet.</li>}
            </ul>
          </section>

          <section className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bot size={16} className="text-primary" />
              <h3 className="text-lg font-semibold">Agent Registry</h3>
            </div>
            <div className="space-y-2 mb-4">
              <Input placeholder="Agent name" value={agentName} onChange={(e) => setAgentName(e.target.value)} />
              <Input placeholder="Emoji (optional)" value={agentEmoji} onChange={(e) => setAgentEmoji(e.target.value)} />
              <Button onClick={() => addAgent.mutate()} disabled={!agentName.trim() || addAgent.isPending}>
                Register Agent
              </Button>
            </div>
            <ul className="text-sm text-zinc-300 space-y-1">
              {agents.map((a) => (
                <li key={a.id} className="flex items-center gap-2 py-1">
                  <span className="shrink-0">{a.emoji || '🤖'}</span>
                  {a.name}
                  {a.self_registered && <span className="text-xs text-muted-foreground">(self-registered)</span>}
                </li>
              ))}
              {agents.length === 0 && <li className="text-muted-foreground text-xs">No agents registered yet.</li>}
            </ul>
          </section>
        </div>
      )}

      {/* Living Docs Tab */}
      {activeTab === 'docs' && (
        <section className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={16} className="text-primary" />
            <h3 className="text-lg font-semibold">Integration Guide (Living Docs)</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Editable documentation stored in Supabase. Use this to maintain API rules, payload formats, and guidelines for your agents.
          </p>
          <Input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Doc title" />
          <Textarea
            value={docContent}
            onChange={(e) => setDocContent(e.target.value)}
            rows={20}
            className="font-mono text-sm"
            placeholder="Write Kanban API rules, payload formats, and update guidelines..."
          />
          <Button onClick={() => saveDoc.mutate()} disabled={saveDoc.isPending}>
            Save Guide
          </Button>
        </section>
      )}
    </div>
  );
};

export default IntegrationGuide;
