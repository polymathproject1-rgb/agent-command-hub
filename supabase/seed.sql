insert into public.tasks (title, agent_name, agent_emoji, priority, progress, column_key)
values
  ('Set up CI/CD pipeline for staging', 'Agent Alpha', '🤖', 'high', null, 'todo'),
  ('Draft Q1 compliance report', 'Audit Bot', '🛡️', 'medium', null, 'todo'),
  ('Optimize database query performance', 'Agent Alpha', '🤖', 'urgent', 65, 'doing'),
  ('Route incoming support tickets', 'Dispatch Bot', '📋', 'medium', 30, 'doing'),
  ('Review security scan results', 'Audit Bot', '🛡️', 'high', null, 'needs-input'),
  ('Clarify API rate limit requirements', 'Agent Alpha', '🤖', 'medium', null, 'needs-input'),
  ('Deploy v2.2.1 hotfix', 'Agent Alpha', '🤖', 'urgent', null, 'done'),
  ('Update onboarding documentation', 'Dispatch Bot', '📋', 'low', null, 'done');
