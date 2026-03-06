import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

dotenv.config({ path: '.env.server' });
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const CLAWBUDDY_API_URL = process.env.CLAWBUDDY_API_URL;
const CLAWBUDDY_WEBHOOK_SECRET = process.env.CLAWBUDDY_WEBHOOK_SECRET;
const DEFAULT_AGENT_NAME = process.env.DEFAULT_AGENT_NAME || 'Rei';
const DEFAULT_AGENT_EMOJI = process.env.DEFAULT_AGENT_EMOJI || '🦐';

if (!CLAWBUDDY_API_URL || !CLAWBUDDY_WEBHOOK_SECRET) {
  console.warn('[clawbuddy] Missing CLAWBUDDY_API_URL or CLAWBUDDY_WEBHOOK_SECRET');
}

function withAgent(payload) {
  return {
    ...payload,
    agent_name: payload.agent_name || DEFAULT_AGENT_NAME,
    agent_emoji: payload.agent_emoji || DEFAULT_AGENT_EMOJI,
  };
}

async function callClawBuddy(payload) {
  if (!CLAWBUDDY_API_URL || !CLAWBUDDY_WEBHOOK_SECRET) {
    throw new Error('Missing server env: CLAWBUDDY_API_URL / CLAWBUDDY_WEBHOOK_SECRET');
  }

  const res = await fetch(CLAWBUDDY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': CLAWBUDDY_WEBHOOK_SECRET,
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
    const error = new Error(`ClawBuddy API error (${res.status})`);
    error.details = data;
    throw error;
  }

  return data;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/clawbuddy', async (req, res) => {
  try {
    const data = await callClawBuddy(req.body || {});
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
    const data = await callClawBuddy(payload);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.details || null });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const data = await callClawBuddy({ request_type: 'task', action: 'create', ...req.body });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message, details: err.details || null });
  }
});

app.patch('/api/tasks/:taskId', async (req, res) => {
  try {
    const data = await callClawBuddy({
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
    const data = await callClawBuddy({
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
  console.log(`[clawbuddy-api] listening on http://localhost:${port}`);
});
