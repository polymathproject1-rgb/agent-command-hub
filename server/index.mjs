import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

dotenv.config({ path: '.env.server' });
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const AGENT_API_URL = process.env.AGENT_COMMAND_API_URL;
const AGENT_API_SECRET = process.env.AGENT_COMMAND_WEBHOOK_SECRET;
const DEFAULT_AGENT_NAME = process.env.DEFAULT_AGENT_NAME || 'Rei';
const DEFAULT_AGENT_EMOJI = process.env.DEFAULT_AGENT_EMOJI || '🦐';

if (!AGENT_API_URL || !AGENT_API_SECRET) {
  console.warn('[agent-hub] Missing AGENT_COMMAND_API_URL or AGENT_COMMAND_WEBHOOK_SECRET in env');
}

function withAgent(payload) {
  return {
    ...payload,
    agent_name: payload.agent_name || DEFAULT_AGENT_NAME,
    agent_emoji: payload.agent_emoji || DEFAULT_AGENT_EMOJI,
  };
}

async function callAgentAPI(payload) {
  if (!AGENT_API_URL || !AGENT_API_SECRET) {
    throw new Error('Missing server env: AGENT_COMMAND_API_URL / AGENT_COMMAND_WEBHOOK_SECRET');
  }

  const res = await fetch(AGENT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': AGENT_API_SECRET,
    },
    body: JSON.stringify(withAgent(payload)),
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const error = new Error(`Agent API error (${res.status})`);
    error.details = data;
    throw error;
  }

  return data;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/agent-tasks', async (req, res) => {
  try {
    const data = await callAgentAPI(req.body || {});
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      details: err.details || null,
    });
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    const payload = {
      request_type: 'task',
      action: 'list',
      ...(req.query.column ? { column: req.query.column } : {}),
    };
    const data = await callAgentAPI(payload);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.details || null });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const data = await callAgentAPI({ request_type: 'task', action: 'create', ...req.body });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.details || null });
  }
});

app.patch('/api/tasks/:taskId', async (req, res) => {
  try {
    const data = await callAgentAPI({
      request_type: 'task',
      action: 'update',
      task_id: req.params.taskId,
      ...req.body,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.details || null });
  }
});

app.post('/api/tasks/:taskId/assign', async (req, res) => {
  try {
    const data = await callAgentAPI({
      request_type: 'assignee',
      action: 'assign',
      task_id: req.params.taskId,
      names: req.body?.names || [],
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.details || null });
  }
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  console.log(`[agent-hub-api] listening on http://localhost:${port}`);
});
