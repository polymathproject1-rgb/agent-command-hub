import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SidebarProvider } from '@/components/ui/sidebar';
import { NavigationContext } from '@/contexts/NavigationContext';
import AppSidebar from '@/components/AppSidebar';
import Header from '@/components/Header';
import CommandDeck from '@/components/tabs/CommandDeck';
import AgentProfiles from '@/components/tabs/AgentProfiles';
import TaskBoard from '@/components/tabs/TaskBoard';
import AILog from '@/components/tabs/AILog';
import Automations from '@/components/tabs/Automations';
import OpCenter from '@/components/tabs/OpCenter';
import MeetingIntelligence from '@/components/tabs/MeetingIntelligence';
import Identity from '@/components/tabs/Identity';
import IntegrationGuide from '@/components/tabs/IntegrationGuide';
import Lexa from '@/components/tabs/Lexa';
import Nova from '@/components/tabs/Nova';
import Forms from '@/components/tabs/Forms';

const sections: Record<string, React.ComponentType> = {
  command: CommandDeck,
  agents: AgentProfiles,
  tasks: TaskBoard,
  log: AILog,
  automations: Automations,
  ops: OpCenter,
  lexa: Lexa,
  nova: Nova,
  forms: Forms,
  identity: Identity,
  meetings: MeetingIntelligence,
  guide: IntegrationGuide,
};

const Index = () => {
  const [activeSection, setActiveSection] = useState('command');
  const ActiveComponent = sections[activeSection] || CommandDeck;

  return (
    <NavigationContext.Provider value={{ activeSection, navigateTo: setActiveSection }}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-3">
              <Header activeSection={activeSection} />
            </div>

            <main className="flex-1 p-4 md:p-6 overflow-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <ActiveComponent />
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </NavigationContext.Provider>
  );
};

export default Index;
