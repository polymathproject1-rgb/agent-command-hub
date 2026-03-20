# ClawBuddy Kit -- Full Source Code Analysis Report

---

## 1. TECH STACK

**Frontend Framework:**
- React 18.3 with TypeScript
- Vite 5.4 (build tool, with SWC plugin for fast compilation)
- React Router DOM 6.30 (client-side routing)

**UI & Styling:**
- Tailwind CSS 3.4 with tailwindcss-animate
- Shadcn/UI component library (full Radix UI primitive set -- 30+ primitives)
- Framer Motion 12.29 (animations throughout every page)
- Lucide React icons (462+)
- Custom fonts: Orbitron (headings), Exo 2 (body), JetBrains Mono (code/data)

**Data Layer:**
- Supabase (PostgreSQL backend, auth, real-time subscriptions, Edge Functions)
- TanStack React Query 5.83 (data fetching with 5-second auto-refetch interval)

**Additional Libraries:**
- @dnd-kit (drag-and-drop for Kanban board)
- Recharts (charts/graphs)
- date-fns / date-fns-tz (date handling)
- xlsx (spreadsheet export)
- DOMPurify (HTML sanitization for reports)
- react-hook-form + zod (form validation)
- react-resizable-panels
- Sonner (toast notifications)

**Backend:**
- Supabase Edge Functions (Deno) -- the `ai-tasks` endpoint is the central API gateway
- Separate office system endpoints (`list-offices`, `manage-office-agent`, `office-agent-status`, etc.)
- Supabase Realtime for live updates (postgres_changes subscriptions)

**Dev/Build:**
- Vitest for testing
- ESLint 9
- Netlify deployment (`netlify.toml` present)
- lovable-tagger (Lovable.dev integration -- the app was partially built with Lovable)

---

## 2. PAGE MAP (All Routes)

| Route | Page Component | Purpose |
|---|---|---|
| `/` | `Index` | Landing/splash page |
| `/auth` | `Auth` | Login/signup with Supabase Auth |
| `/onboarding` | `OnboardingPage` | New user onboarding |
| `/dashboard` | `DashboardPage` | Main dashboard with KPIs, charts, AI status |
| `/board` | `BoardPage` | Kanban task board with drag-and-drop |
| `/command-center` | `CommandCenterPage` | Multi-tab AI employee command & control center |
| `/ai-employees` | `AiEmployeesPage` | AI employee roster management |
| `/forge` | `ForgePage` | AI-powered knowledge-to-task analyzer |
| `/goals` | `GoalsLabPage` | Goal decomposition with AI analysis |
| `/identity` | `IdentityPage` | Agent identity system overview |
| `/identity/:agentId` | `AgentIdentityPage` | Per-agent identity files, memory, daily logs |
| `/log` | `LogPage` | AI activity journal with categories |
| `/questions` | `QuestionsPage` | Questions & approval requests from AI |
| `/skills` | `SkillsPage` | Active skills + in-progress skill factory |
| `/skills/new` | `SkillFactoryPage` | Create new API skill |
| `/skills/edit/:id` | `SkillFactoryPage` | Edit existing skill |
| `/skills/factory` | `SkillFactoryPage2` | Skill factory v2 |
| `/skills/factory/new` | `ClaudeCodeSkillEditor` | Claude Code skill editor |
| `/skills/factory/:id` | `SkillDetailPage` | Individual skill detail |
| `/agent-teams` | `AgentTeamsPage` | Multi-agent team management |
| `/workspace` | `WorkspacePage` | Office workspace overview grid |
| `/workspace/office/:id` | `OfficePage` | 2D animated office with canvas rendering |
| `/workspace/office/:id/work` | `OfficeWorkPage` | Office work view |
| `/workspace/arena/:id` | `ArenaPage` | Competitive arena with scoreboard |
| `/workspace/boiler-room/:id` | `BoilerRoomPage` | Boiler room variant of office |
| `/ops-center` | `OpsCenterPage` | AI-built mini-app directory |
| `/ops-center/:appName` | `OpsAppPage` | Individual ops app view |
| `/automations` | `AutomationsPage` | Scheduled jobs, webhook queue, functions |
| `/reports` | `ReportsPage` | HTML reports & AI insights viewer |
| `/settings` | `SettingsPage` | API config, agents, webhooks, integration guide |

Total: **30+ distinct routes** across the application.

---

## 3. DASHBOARD FEATURES

The dashboard (`/dashboard`) provides a real-time operational overview:

**KPI Row (5 stat cards):** Total Tasks, Completed, Needs Input, AI Tasks, Sub-Agents -- each with colored accent bars and Orbitron-font numbers.

**AI Status Card:** Shows the primary AI agent's avatar with an online/offline status ring, current status message, and last-seen timestamp using a connection freshness algorithm (online/recent/offline).

**AI Impact Panel:** Tasks done today, tasks done this week, reports generated today, insights generated today, log entries today.

**Charts:**
- Completion Rate -- radial/donut chart (Recharts)
- Priority Distribution -- bar chart showing Low/Medium/High/Urgent counts
- Weekly Progress -- 7-day bar chart of completed tasks per day

**Right Sidebar Panels:** Pending questions count (linked), AI Log feed (latest 8 entries), Sub-agents summary (running/idle), Workspace offices count, Unread reports count.

**Data Refresh:** All data auto-refreshes every 5 seconds via TanStack React Query's `refetchInterval: 5000`.

---

## 4. AI EMPLOYEE INTERFACES

**AI Employees Page (`/ai-employees`):**
- Grid of expandable employee cards with emoji, name, role, department, platform (Claude Code, OpenClaw, Codex, custom)
- Status badges: Active, Idle, On Assignment, Training, Terminated, Coming Soon
- Department color coding: sales (orange), research (cyan), operations (indigo), content (pink), support (green)
- Expandable details show: description, metrics grid (rates, costs, revenue), skill badges, hired date, last active
- "View Dashboard" button links to the employee's OpsCenter app
- Filter bar by department

**Command Center (`/command-center`):**
7 tabs for full AI workforce management:
1. **Command Deck** -- System status bar (operational/degraded), KPI cards (alignment score, active employees, tasks completed 7d, tasks in flight), agent roster with status dots, activity feed
2. **Employee Profiles** -- Detailed agent profiles
3. **Agent Comms** -- Inter-agent communication log with unread badge
4. **Council** -- Multi-agent deliberation sessions with active count badge
5. **Orchestration** -- Agent coordination and workflow management
6. **Work History (Session Intel)** -- Historical session data
7. **Compliance & Safety (Guardrails)** -- Safety and alignment monitoring

**Alignment Gauge:** A computed alignment score displayed as a gauge, with pass/warn/fail checks.

**Identity System (`/identity`):**
- Grid of agent cards, click to view per-agent identity
- Per-agent view shows: FileCardGrid (persona, instructions, memory config files), DailyLogsSection (daily log entries with modal viewer), FileEditorModal for editing

---

## 5. AUTONOMOUS BUILD FEATURES

**Forge (`/forge`):**
The Forge is a knowledge-to-task pipeline. Users paste content (text, URLs) and the AI analyzes it to identify buildable items:
- Input modes: text paste or URL analysis
- AI analysis identifies: Skills & Tools, OpsCenter Apps, Automations & Scenarios
- Results show as selectable ForgeAnalysisCards with complexity indicators (simple/moderate/complex)
- Users can toggle-select items, add notes, assign to specific agents, then "Assign to Board" to create Kanban tasks
- Past analyses are saved in a ForgeHistoryGrid
- Animated analyzing state with shimmer effects and rotating hammer icon

**Skills Factory (`/skills`):**
- Active skills section shows deployed API integrations with operation counts
- Factory section shows in-progress skills (draft/ready/archived)
- Skill creation editor for defining API endpoint configurations
- Claude Code Skill Editor for more advanced skill authoring

**Automations (`/automations`):**
- Scheduled AI jobs with cron-based scheduling
- KPI cards: Active Jobs, Total Runs, Success Rate, Next Run countdown
- Webhook Queue tab for processing incoming webhooks
- Functions & Webhooks management tab
- Channel Manager for delivery pipeline configuration
- Full CRUD: create, edit, enable/disable, view execution history

---

## 6. MEMORY/BRAIN VISUALIZATION

**Memory Injection (`/memory` -- via MemoryPage):**
- MemoryInjectionForm for submitting persistent knowledge entries
- PastInjectionsList showing previously submitted memories
- Memories are submitted for human approval before becoming persistent

**Identity Files (per-agent at `/identity/:agentId`):**
- FileCardGrid displays config files as cards: persona definition, system instructions, memory data
- FileEditorModal allows viewing and editing identity files
- DailyLogsSection renders daily log entries with DailyLogCard components and DailyLogModal for detail view
- Files are managed via the `useIdentityFiles` hook querying Supabase

**Cognitive Layer:**
The system does not render a neural graph or explicit "brain visualization." Instead, the cognitive architecture is expressed through:
- Identity files (persona, instructions, memory) -- the agent's "configuration"
- AI Log entries -- the agent's "stream of consciousness"
- Memory injections -- human-curated persistent knowledge
- Daily logs -- temporal cognitive record

---

## 7. INTEGRATION POINTS

**Supabase (Primary Backend):**
- Auth (email/password sign-up/in, session persistence)
- PostgreSQL database with 25+ tables (tasks, ai_agents, ai_employees, ai_log, ai_questions, ai_insights, sub_agents, offices, office_agents, office_events, skills, automations, reports, ops_data, goals, forge_analyses, memory_injections, identity_files, daily_logs, council sessions, agent_comms, arena scoreboards, etc.)
- Supabase Realtime subscriptions (office_agents changes, office_events inserts for live animation)
- Edge Functions: `ai-tasks` (central API), `goal-analyzer`, office management functions

**Webhook/API System:**
- `x-webhook-secret` authentication for AI agent access
- Central `ai-tasks` edge function handles 20+ request types
- Raw webhook queue for processing incoming data from external services

**Make.com Integration:**
- Referenced in edge function registry and integration guides
- Automation scenarios (Make scenarios) are a forge analysis output type

**Telegram:**
- Referenced in CLAUDE.md (sync-and-restart.sh for telegram-bot)
- Not directly in the frontend source but integrated via the backend

**Office System (Animated 2D):**
- Separate edge functions: `list-offices`, `manage-office-agent`, `create-office-task`, `office-agent-status`, `reset-office`, `upload-office-deliverable`
- Canvas-based rendering with pathfinding, sprite animation, desk positions, water cooler, coffee machine, conference room
- Real-time agent status updates drive character animations

---

## 8. VISUAL DESIGN

**Color Scheme:**
- Dark-first design (background: `0 0% 4%` -- near-black)
- Primary accent: **Red** (`0 72% 51%` -- a vibrant crimson/red)
- Card surfaces: `0 0% 6%` -- very dark gray
- Text: `0 0% 95%` -- near-white
- Column colors: Red (todo), Amber (doing), Purple (needs input), Gray (canceled), Green (done)
- Forge-specific palette: Blue (skill), Purple (ops-app), Yellow (automation), Green (edge-function), Orange (tool), Pink (make-scenario)

**Typography:**
- **Orbitron** -- used for all headings and large numbers (futuristic/sci-fi feel, all-caps tracking)
- **Exo 2** -- used for body text and descriptions
- **JetBrains Mono** -- used for code blocks and data displays
- CSS class `text-glow` for illuminated heading effects

**Glass Morphism:**
- Extensive use of `glass` utility class: `backdrop-blur-xl`, semi-transparent backgrounds (`bg-card/50`, `bg-card/30`)
- Glass borders with `border-border/30` opacity
- `glass-card`, `glass-strong`, `glass-card-futuristic` variants throughout

**Animation:**
- Framer Motion on every page (fade-up entrances, staggered card reveals, hover scale effects)
- Particle background effect (`ParticleBackground` component in layout)
- Sidebar: holographic shimmer accent line, grid pattern overlay
- Custom keyframes: float, glow-pulse, gradient-shift, shimmer
- Status dots with pulse animations
- `pulse-glow` on floating action buttons

**Layout Patterns:**
- Sidebar + main content layout (sidebar collapses to icons)
- Sidebar has ClawBuddy logo, 15 nav items with notification badges (unread counts, failed automations, needs-input)
- Header component at top of main content
- Max-width containers (`max-w-7xl`) with responsive grids
- Responsive: mobile-first with `sm:`, `md:`, `lg:` breakpoints throughout

**Component Quality:**
- 40+ custom UI components from Shadcn/UI (fully styled)
- 25+ custom domain components (KanbanColumn, SkillCard, ForgeAnalysisCard, OfficeCanvas, etc.)
- Proper loading states with Skeleton components everywhere
- Empty states with relevant icons and call-to-action buttons
- Toast notifications for all mutations (success/error via Sonner)
- Modal dialogs for detail views and editors
- Drag-and-drop Kanban board with drag overlay

**Overall Aesthetic:** The application has a **sci-fi command center aesthetic** -- dark backgrounds, red accent glows, Orbitron headings, glass morphism cards, particle effects, and holographic UI elements. It looks like a futuristic mission control dashboard for managing an AI workforce.

---

## Summary of Key File Paths

- Entry point: `src/App.tsx`
- Layout: `src/components/layout/AppLayout.tsx`
- Sidebar nav: `src/components/layout/Sidebar.tsx`
- Theme/CSS: `src/index.css`
- Tailwind config: `tailwind.config.ts`
- Supabase client: `src/integrations/supabase/client.ts`
- Supabase types: `src/integrations/supabase/types.ts`
- All pages: `src/pages/` (28 page files)
- All hooks: `src/hooks/` (55+ hooks)
- All components: `src/components/` (25 subdirectories)
- CLAUDE.md integration spec: `CLAUDE.md`
