import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  createHuman,
  fetchAgents,
  fetchHumans,
  fetchIntegrationDoc,
  registerAgent,
  upsertIntegrationDoc,
} from '@/features/platform/api';

const DOC_SLUG = 'kanban-api';

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="rounded-xl border border-white/10 p-4 bg-zinc-900/50">
          <h3 className="text-lg font-semibold mb-3">People Registry</h3>
          <div className="space-y-2 mb-4">
            <Input placeholder="Human name" value={humanName} onChange={(e) => setHumanName(e.target.value)} />
            <Input placeholder="Role (optional)" value={humanRole} onChange={(e) => setHumanRole(e.target.value)} />
            <Button onClick={() => addHuman.mutate()} disabled={!humanName.trim() || addHuman.isPending}>
              Add Human
            </Button>
          </div>
          <ul className="text-sm text-zinc-300 space-y-1">
            {humans.map((h) => (
              <li key={h.id}>• {h.display_name}{h.role ? ` — ${h.role}` : ''}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-white/10 p-4 bg-zinc-900/50">
          <h3 className="text-lg font-semibold mb-3">Agent Registry</h3>
          <div className="space-y-2 mb-4">
            <Input placeholder="Agent name" value={agentName} onChange={(e) => setAgentName(e.target.value)} />
            <Input placeholder="Emoji (optional)" value={agentEmoji} onChange={(e) => setAgentEmoji(e.target.value)} />
            <Button onClick={() => addAgent.mutate()} disabled={!agentName.trim() || addAgent.isPending}>
              Register Agent
            </Button>
          </div>
          <ul className="text-sm text-zinc-300 space-y-1">
            {agents.map((a) => (
              <li key={a.id}>• {a.emoji || '🤖'} {a.name} {a.self_registered ? '(self-registered)' : ''}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-white/10 p-4 bg-zinc-900/50">
        <h3 className="text-lg font-semibold mb-3">Integration Guide (Living Docs)</h3>
        <div className="space-y-2">
          <Input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Doc title" />
          <Textarea
            value={docContent}
            onChange={(e) => setDocContent(e.target.value)}
            rows={16}
            placeholder="Write Kanban API rules, payload formats, and update guidelines..."
          />
          <Button onClick={() => saveDoc.mutate()} disabled={saveDoc.isPending}>
            Save Guide
          </Button>
        </div>
      </section>
    </div>
  );
};

export default IntegrationGuide;
