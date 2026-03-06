import { Search, Bell, Settings, User } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { agents } from '@/data/mockData';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const sectionLabels: Record<string, string> = {
  command: 'Command Deck',
  agents: 'Agents',
  tasks: 'Task Board',
  log: 'AI Log',
  council: 'Council',
  meetings: 'Meetings',
};

interface HeaderProps {
  activeSection: string;
}

const Header = ({ activeSection }: HeaderProps) => {
  const activeAgent = agents[0];

  return (
    <header className="glass-card px-4 py-3 flex items-center gap-4">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground shrink-0" />

      <div className="hidden sm:block h-5 w-px bg-border shrink-0" />

      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <span className="text-muted-foreground text-xs font-mono">🐾 ClawBuddy</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-xs font-heading">
              {sectionLabels[activeSection] || 'Dashboard'}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1" />

      <div className="relative hidden md:block w-64">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search..."
          className="pl-8 h-8 text-xs bg-secondary/30 border-secondary/50 focus:border-primary/40 rounded-lg"
        />
      </div>

      <div className="hidden sm:flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
        <span className="text-xs text-muted-foreground font-mono">
          {activeAgent.emoji} Online
        </span>
      </div>

      <button className="relative p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
        <Bell size={16} />
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-bounce-badge">
          3
        </span>
      </button>

      <button className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
        <Settings size={16} />
      </button>

      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center border border-primary/20">
        <User size={14} className="text-foreground" />
      </div>
    </header>
  );
};

export default Header;
