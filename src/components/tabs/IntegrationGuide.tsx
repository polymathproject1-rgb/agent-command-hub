import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, BookOpen, Key, Terminal, Users, Bot, FileText } from 'lucide-react';
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
const AGENT_API_URL = `${SUPABASE_URL}/functions/v1/ai-tasks`;

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
      {/* Tab navigation */}
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
              <EnvVarRow name="AGENT_COMMAND_WEBHOOK_SECRET" value="(set in .env.server)" />
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
                code={`{
  "request_type": "task",
  "action": "list",
  "agent_name": "YourAgent",
  "agent_emoji": "🤖"
}`}
              />
              <CodeBlock
                title="List tasks by column"
                language="json"
                code={`{
  "request_type": "task",
  "action": "list",
  "column": "to_do",
  "agent_name": "YourAgent",
  "agent_emoji": "🤖"
}

// Valid columns: to_do, doing, needs_input, done, canceled`}
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
  "request_type": "task",
  "action": "create",
  "title": "Build the landing page",
  "priority": "high",
  "agent_name": "YourAgent",
  "agent_emoji": "🤖"
}

// Priority values: low, medium, high, critical`}
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
  "request_type": "task",
  "action": "update",
  "task_id": "uuid-of-the-task",
  "column": "doing",
  "agent_name": "YourAgent",
  "agent_emoji": "🤖"
}`}
              />
              <CodeBlock
                title="Update title and priority"
                language="json"
                code={`{
  "request_type": "task",
  "action": "update",
  "task_id": "uuid-of-the-task",
  "title": "Updated task title",
  "priority": "critical",
  "agent_name": "YourAgent",
  "agent_emoji": "🤖"
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
  "request_type": "assignee",
  "action": "assign",
  "task_id": "uuid-of-the-task",
  "names": ["Rei", "Kira"],
  "agent_name": "YourAgent",
  "agent_emoji": "🤖"
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
    "request_type": "task",
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
AGENT_COMMAND_WEBHOOK_SECRET=your-webhook-secret-here`}
            />
            <CodeBlock
              title="Minimal Node.js agent"
              language="javascript"
              code={`const API_URL = process.env.AGENT_COMMAND_API_URL;
const SECRET = process.env.AGENT_COMMAND_WEBHOOK_SECRET;

async function createTask(title, priority = 'medium') {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': SECRET,
    },
    body: JSON.stringify({
      request_type: 'task',
      action: 'create',
      title,
      priority,
      agent_name: 'MyAgent',
      agent_emoji: '🤖',
    }),
  });
  return res.json();
}

async function moveToDoing(taskId) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': SECRET,
    },
    body: JSON.stringify({
      request_type: 'task',
      action: 'update',
      task_id: taskId,
      column: 'doing',
      agent_name: 'MyAgent',
      agent_emoji: '🤖',
    }),
  });
  return res.json();
}`}
            />
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
