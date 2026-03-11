import { Zap, Users, ClipboardList, FileText, Landmark, Mic, BookOpen } from 'lucide-react';
import { agents } from '@/data/mockData';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { id: 'command', label: 'Command Deck', icon: Zap },
  { id: 'agents', label: 'Agents', icon: Users },
  { id: 'tasks', label: 'Task Board', icon: ClipboardList },
  { id: 'log', label: 'AI Log', icon: FileText },
  { id: 'council', label: 'Council', icon: Landmark },
  { id: 'meetings', label: 'Meetings', icon: Mic },
  { id: 'guide', label: 'Integration Guide', icon: BookOpen },
];

const statusColors: Record<string, string> = {
  active: 'bg-primary',
  idle: 'bg-amber',
  error: 'bg-destructive',
  offline: 'bg-muted-foreground',
};

interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (id: string) => void;
}

const AppSidebar = ({ activeSection, onSectionChange }: AppSidebarProps) => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/15 shrink-0 glow-primary">
            <img src="/logo.svg" alt="ACH" className="w-6 h-6" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold font-heading text-foreground truncate">Agent Command Hub</h1>
              <p className="text-[10px] text-muted-foreground font-mono truncate">Command Center</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-mono">
            {!collapsed ? 'Navigation' : ''}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onSectionChange(item.id)}
                      tooltip={item.label}
                      className={`
                        group relative rounded-lg transition-all duration-200 h-10
                        ${isActive
                          ? 'bg-primary/10 text-primary shadow-[inset_3px_0_0_0_hsl(var(--primary))]'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                        }
                      `}
                    >
                      <item.icon size={18} className={`shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                      <span className="truncate">{item.label}</span>
                      {isActive && (
                        <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed ? (
          <div className="glass-card p-3 space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-mono">Agent Status</p>
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center gap-2">
                <span className="relative flex h-2 w-2 shrink-0">
                  {agent.status === 'active' && (
                    <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: agent.accentColor }} />
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${statusColors[agent.status]}`} />
                </span>
                <span className="text-xs text-foreground truncate">{agent.emoji} {agent.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            {agents.map((agent) => (
              <span key={agent.id} className="relative flex h-2.5 w-2.5" title={`${agent.name}: ${agent.status}`}>
                {agent.status === 'active' && (
                  <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: agent.accentColor }} />
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusColors[agent.status]}`} />
              </span>
            ))}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
