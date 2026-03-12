-- Agent Identity Cards: editable markdown documents per agent
CREATE TABLE agent_identity_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  card_type text NOT NULL CHECK (card_type IN ('soul', 'identity', 'user', 'memory', 'agents', 'tools', 'heartbeat')),
  title text NOT NULL,
  description text,
  content_md text DEFAULT '',
  updated_by text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, card_type)
);

ALTER TABLE agent_identity_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read"  ON agent_identity_cards FOR SELECT TO public USING (true);
CREATE POLICY "Allow anonymous insert" ON agent_identity_cards FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON agent_identity_cards FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous delete" ON agent_identity_cards FOR DELETE TO public USING (true);

-- Agent Daily Logs: one entry per agent per day
CREATE TABLE agent_daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  title text NOT NULL,
  content_md text DEFAULT '',
  written_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, log_date)
);

ALTER TABLE agent_daily_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read"  ON agent_daily_logs FOR SELECT TO public USING (true);
CREATE POLICY "Allow anonymous insert" ON agent_daily_logs FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON agent_daily_logs FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous delete" ON agent_daily_logs FOR DELETE TO public USING (true);

-- Register Bujji (the assistant) as an agent
INSERT INTO agents (name, emoji, status, can_self_register, self_registered)
VALUES ('Bujji', '🐾', 'active', false, false)
ON CONFLICT DO NOTHING;

-- Seed identity cards for Rei
INSERT INTO agent_identity_cards (agent_id, card_type, title, description, content_md, updated_by) VALUES
  ('262c74b9-8003-4914-afd4-62ed55df8b3e', 'soul',      'SOUL.md',      'Core identity & operating principles', '', 'System'),
  ('262c74b9-8003-4914-afd4-62ed55df8b3e', 'identity',   'IDENTITY.md',  'Personal metadata (name, creature, vibe)', '', 'System'),
  ('262c74b9-8003-4914-afd4-62ed55df8b3e', 'user',       'USER.md',      'User profile (your context & preferences)', '', 'System'),
  ('262c74b9-8003-4914-afd4-62ed55df8b3e', 'memory',     'MEMORY.md',    'Long-term curated memory', '', 'System'),
  ('262c74b9-8003-4914-afd4-62ed55df8b3e', 'agents',     'AGENTS.md',    'System instructions & session checklist', '', 'System'),
  ('262c74b9-8003-4914-afd4-62ed55df8b3e', 'tools',      'TOOLS.md',     'Tool preferences & verified data', '', 'System'),
  ('262c74b9-8003-4914-afd4-62ed55df8b3e', 'heartbeat',  'HEARTBEAT.md', 'Periodic task checklist', '', 'System')
ON CONFLICT (agent_id, card_type) DO NOTHING;

-- Seed identity cards for Bujji (using subquery since we don't know the ID)
INSERT INTO agent_identity_cards (agent_id, card_type, title, description, content_md, updated_by)
SELECT a.id, v.card_type, v.title, v.description, '', 'System'
FROM agents a
CROSS JOIN (VALUES
  ('soul',      'SOUL.md',      'Core identity & operating principles'),
  ('identity',  'IDENTITY.md',  'Personal metadata (name, creature, vibe)'),
  ('user',      'USER.md',      'User profile (your context & preferences)'),
  ('memory',    'MEMORY.md',    'Long-term curated memory'),
  ('agents',    'AGENTS.md',    'System instructions & session checklist'),
  ('tools',     'TOOLS.md',     'Tool preferences & verified data'),
  ('heartbeat', 'HEARTBEAT.md', 'Periodic task checklist')
) AS v(card_type, title, description)
WHERE a.name = 'Bujji'
ON CONFLICT (agent_id, card_type) DO NOTHING;
