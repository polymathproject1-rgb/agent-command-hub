import { Settings } from 'lucide-react';
import { agents } from '@/data/mockData';

const Header = () => {
  const activeAgent = agents[0];

  return (
    <header className="glass-card border-l-2 border-l-primary px-6 py-4 flex items-center justify-between glow-primary">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🐾</span>
        <div>
          <h1 className="text-xl font-bold font-heading text-foreground">ClawBuddy</h1>
          <p className="text-xs text-muted-foreground font-mono">AI Agent Command Center</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{activeAgent.emoji} {activeAgent.name}: Online</p>
            <p className="text-xs text-muted-foreground">Last seen: {activeAgent.lastSeen}</p>
          </div>
        </div>
        <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
