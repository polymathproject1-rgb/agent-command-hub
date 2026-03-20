# ClawBuddy — Full System Analysis
**Source:** Complete codebase at /Users/rei/Masterclass/clawbuddy/clawbuddy-kit-main/

## Tech Stack
- React 18 + TypeScript + Vite + Tailwind + shadcn/ui
- Supabase (PostgreSQL + Edge Functions + Realtime + Auth)
- 30+ routes, 55+ hooks, 25+ DB tables, 25 Edge Functions, 65+ SQL migrations
- Framer Motion animations, Recharts charts, glass morphism dark theme
- Fonts: Orbitron (headings), Exo 2 (body), JetBrains Mono (code)

## Architecture (3 Layers)
1. **Backend:** Supabase — single `ai-tasks` edge function routes 20+ request types
2. **Frontend:** React dashboard on Netlify — real-time subscriptions, OpsCenter modular apps
3. **Agent Layer:** CLAUDE.md brain + bash hooks + STATUS.md/MEMORY.md persistence

## AI Employees
- **Sherlock** — Lead build agent (Claude Code). 8-phase /autopilot loop
- **Ray** — Coordinator (OpenClaw). Night shift manager, assigns work, monitors, QAs
- **Lexa** — AI Phone Employee (Millis AI). Inbound/outbound calls, transcripts, sentiment, campaigns
- **Nova** — AI Email Employee (Resend). Templates, sequences, open/click tracking, campaigns
- **PepperPots** — Meeting Intelligence (Fathom AI)
- **Jason** — Example AI SDR

## Key Features
1. **Kanban Board** — 5-column task management with drag-and-drop
2. **AI Activity Log** — Categorized journal with unread badges
3. **Questions & Approvals** — Human-in-the-loop async system
4. **Animated 2D Office** — Canvas-rendered characters with pathfinding, status, thought bubbles
5. **Cognitive Memory** — Human-approved persistent knowledge across sessions
6. **Autonomous Orchestration** — Overnight builds with coordinator/executor pattern
7. **Self-Evolution** — 3-hour improvement cycles, learning log, alignment scoring (12 checks)
8. **The Forge** — Knowledge-to-task pipeline (paste content → AI identifies buildable items)
9. **Skills Factory** — API skill configs with version control
10. **OpsCenter** — Modular apps platform (19 block types)

## Autonomous Build System
- Coordinator reads Kanban → picks highest-priority task → assigns executor
- Executor runs 8-phase loop: Context → Plan → Task Board → Build → Validate → Heal → Report → Close
- Mandatory heartbeat every 5 minutes, stale detection after 10 min
- Self-healing up to 5 attempts using MEMORY.md patterns
- Morning report generated when all tasks complete

## Autonomy Envelope (Safety)
**Pre-approved:** file edits, API calls, logging, git commits after validation, self-healing
**Requires human approval:** deployment, DB migrations, .env changes, deleting files, sending emails, spending money

## Session Intelligence Hooks
- `session-start.sh` — Sets online, loads STATUS.md, checks queue
- `pre-compact-save.sh` — Forces state save before context loss
- `command-guard.sh` — Blocks destructive bash commands (shlex parsing)
- `typecheck.sh` — Auto-runs tsc after .ts/.tsx edits
- `alignment-check.sh` — 12-check scoring system

## Telegram Integration
- Mobile command interface via Telegram bot
- Send tasks from phone → appear on Kanban in real-time
- Morning Digest and Evening Report delivered to Telegram
- Voice message support via Deepgram

## Landing Page (join.verticalsystems.io)
- $99/month for fork-ready production system
- Brian Baskin case study: deployed in 4 days, $62K ROI from ~$100 AI credits
- Positioned as "Agents in a Box" — fork, deploy, connect in 20 minutes
- Target: agency owners, consultants, Claude Code/OpenClaw builders

## What Makes This Unique (vs ALL competitors)
Nobody else has: overnight autonomous builds, animated AI offices, cognitive memory with approval gates, self-improving agents, Telegram command integration, morning report system, human-in-the-loop question system, cross-agent dispatch, alignment scoring
