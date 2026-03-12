-- AI Logs table: structured activity log for all agents
CREATE TABLE ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  agent_emoji text,
  message text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read"   ON ai_logs FOR SELECT TO public USING (true);
CREATE POLICY "Allow anonymous insert"  ON ai_logs FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow anonymous update"  ON ai_logs FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous delete"  ON ai_logs FOR DELETE TO public USING (true);

-- Seed a few entries
INSERT INTO ai_logs (agent_name, agent_emoji, message, category) VALUES
  ('Bujji', '🐾', 'AI Log system initialized. All agents can now write structured log entries.', 'general'),
  ('Rei', '🦐', 'Daemon online. Polling for tasks.', 'heartbeat');
