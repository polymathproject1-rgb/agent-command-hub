-- Lexa AI Phone Employee Schema
-- 4 tables: lexa_leads, lexa_campaigns, lexa_calls, lexa_daily_metrics

-- 1. Leads table
CREATE TABLE IF NOT EXISTS lexa_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  company text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','converted','dnc')),
  tags text[] DEFAULT '{}',
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Campaigns table
CREATE TABLE IF NOT EXISTS lexa_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  agent_prompt text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','running','paused','completed')),
  from_phone text,
  total_leads int DEFAULT 0,
  completed_leads int DEFAULT 0,
  config jsonb DEFAULT '{"max_concurrent": 1, "delay_between_calls": 30, "retry_failed": false}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Calls table
CREATE TABLE IF NOT EXISTS lexa_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id text,
  session_id text,
  from_phone text,
  to_phone text,
  direction text NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound','inbound')),
  status text NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated','in-progress','completed','user-ended','api-ended','error','timeout')),
  duration_seconds int,
  cost numeric(10,4),
  transcript jsonb DEFAULT '[]',
  sentiment text CHECK (sentiment IN ('positive','neutral','negative')),
  recording_url text,
  agent_name text,
  campaign_id uuid REFERENCES lexa_campaigns(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES lexa_leads(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lexa_calls_session_id ON lexa_calls(session_id) WHERE session_id IS NOT NULL;

-- 4. Daily metrics table
CREATE TABLE IF NOT EXISTS lexa_daily_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  total_calls int DEFAULT 0,
  avg_duration numeric DEFAULT 0,
  total_cost numeric DEFAULT 0,
  answer_rate numeric DEFAULT 0,
  sentiment_breakdown jsonb DEFAULT '{"positive": 0, "neutral": 0, "negative": 0}',
  created_at timestamptz DEFAULT now()
);

-- RLS: Enable and add permissive policies (matching existing pattern)
ALTER TABLE lexa_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lexa_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE lexa_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE lexa_daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous access to lexa_leads" ON lexa_leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous access to lexa_campaigns" ON lexa_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous access to lexa_calls" ON lexa_calls FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous access to lexa_daily_metrics" ON lexa_daily_metrics FOR ALL USING (true) WITH CHECK (true);
