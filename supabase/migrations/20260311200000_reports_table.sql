-- Reports table: stores HTML reports/files uploaded by agents after task completion
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  title text NOT NULL,
  html_content text NOT NULL DEFAULT '',
  file_type text DEFAULT 'html',
  uploaded_by text,
  agent_name text,
  agent_emoji text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read"  ON reports FOR SELECT TO public USING (true);
CREATE POLICY "Allow anonymous insert" ON reports FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON reports FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous delete" ON reports FOR DELETE TO public USING (true);
