import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Header from '@/components/Header';
import CommandDeck from '@/components/tabs/CommandDeck';
import AgentProfiles from '@/components/tabs/AgentProfiles';
import TaskBoard from '@/components/tabs/TaskBoard';
import AILog from '@/components/tabs/AILog';
import Council from '@/components/tabs/Council';
import MeetingIntelligence from '@/components/tabs/MeetingIntelligence';

const tabs = [
  { id: 'command', label: '⚡ Command Deck' },
  { id: 'agents', label: '🤖 Agents' },
  { id: 'tasks', label: '📋 Task Board' },
  { id: 'log', label: '📝 AI Log' },
  { id: 'council', label: '🏛️ Council' },
  { id: 'meetings', label: '🎙️ Meetings' },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState('command');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <Header />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass-card h-auto p-1.5 flex flex-wrap gap-1 bg-transparent border border-secondary">
          {tabs.map((tab, i) => (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <TabsTrigger
                value={tab.id}
                className="text-xs sm:text-sm font-medium font-heading data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {tab.label}
              </TabsTrigger>
            </motion.div>
          ))}
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-6"
          >
            <TabsContent value="command" className="mt-0"><CommandDeck /></TabsContent>
            <TabsContent value="agents" className="mt-0"><AgentProfiles /></TabsContent>
            <TabsContent value="tasks" className="mt-0"><TaskBoard /></TabsContent>
            <TabsContent value="log" className="mt-0"><AILog /></TabsContent>
            <TabsContent value="council" className="mt-0"><Council /></TabsContent>
            <TabsContent value="meetings" className="mt-0"><MeetingIntelligence /></TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
};

export default Index;
