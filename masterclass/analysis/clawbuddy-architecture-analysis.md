# ClawBuddy Kit -- Full System Analysis

---

## 1. ARCHITECTURE OVERVIEW

ClawBuddy is a three-layer system that turns AI coding agents (Claude Code, OpenClaw, or any custom agent) into visible, trackable, self-improving "AI employees" with a real-time dashboard.

**Layer 1 -- Backend (Supabase)**
- 25 Supabase Edge Functions (Deno) handle all API routing through a single gateway: `ai-tasks`. This one function routes across 20+ "request types" (tasks, logs, questions, insights, memory, skills, ops, automations, etc.)
- 65+ SQL migrations create the full schema: Kanban boards, agent logs, OpsCenter apps, learning logs, office agents, Lexa call tables, Nova email tables, etc.
- pg_cron runs scheduled automations (morning digest, evening report, competitor intel, meeting intelligence, stale-run watchdog)

**Layer 2 -- Frontend (React + Netlify)**
- React 18 / TypeScript / Vite / Tailwind / shadcn/ui dashboard
- OpsCenter is a modular "apps platform" -- each module (Creator Command, Meeting Intelligence, Lexa, Nova, AI Employees) is an OpsCenter App with Pages and Blocks
- 30+ custom block components, real-time Supabase subscriptions, Recharts visualizations
- Animated 2D office with characters that move and "think" in real time

**Layer 3 -- Agent Layer (Claude Code / OpenClaw)**
- CLAUDE.md serves as the "system brain" -- Claude Code reads it automatically and follows the workflow protocol
- Bash hooks in `.claude/hooks/` fire on session lifecycle events (start, pre-compact, tool use)
- Skills stored as JSON configs in the Skill Factory, read at runtime
- STATUS.md + MEMORY.md files bridge context across sessions

**Data flow:** Agent makes HTTP POST to `ai-tasks` edge function --> routes by `request_type` + `action` --> reads/writes Supabase tables --> frontend picks up changes via real-time subscriptions or polling.

---

## 2. MODULE MAP

### Core Platform Modules

| Module | File | Purpose | Key Inputs | Key Outputs | Dependencies |
|--------|------|---------|-----------|-------------|-------------|
| **CLAUDE.md** | `/CLAUDE.md` | Agent instruction set -- the "brain" | None (read by agent) | Behavioral protocol for all API calls | Supabase, webhook secret |
| **Supercharge Claude Code** | `/modules/supercharge-claude-code.md` | Telegram bot, web research hub, 5 automations, calendar sync, session management | Telegram tokens, Make.com, OpenAI key | Mobile command interface, scheduled reports, persistent sessions | ClawBuddy core, Make.com, Telegram API |
| **Skill Library** | `/modules/skill-library.md` | 5 pre-built API skills (Telegram, email, search, calendar, document analysis) with JSON configs | API keys per service | Runtime-discoverable skill configs agents can execute | ClawBuddy Skill Factory |
| **Cognitive Memory** | `/modules/cognitive-memory.md` | Persistent agent memory across sessions | Agent observations, user preferences | Approved memory entries + self-consolidating learning log | Sherlock Brain edge function |
| **Command Center Orchestration** | `/modules/command-center-orchestration.md` | Session hooks, /autopilot build loop, progress broadcasting, cross-agent dispatch, alignment scoring, self-evolution | Claude Code lifecycle events | Live build tracker, heartbeats, inter-agent comms, alignment scores | 5 bash hooks, pg_cron watchdog, `agent_comms` table |
| **Autonomous Orchestration** | `/modules/autonomous-orchestration.md` | Overnight unattended builds with coordinator/executor pattern | Kanban task queue, priority ordering | Morning report, completed builds, QA results | Command Center hooks, Cognitive Memory, Skill Library |

### Domain Modules (OpsCenter Apps)

| Module | File | OpsCenter Blocks | Purpose |
|--------|------|-----------------|---------|
| **Creator Command** | `/modules/creator-command.md` | 8 blocks (`yt_dashboard`, `yt_analytics`, `yt_competitors`, `yt_banger_lab`, `yt_pipeline`, `yt_scripts`, `yt_intel_feed`, `yt_outlier_feed`) | YouTube channel analytics, competitor tracking, video idea scoring, content pipeline, viral outlier detection |
| **Meeting Intelligence** | `/modules/meeting-intelligence.md` | 2 blocks (`meeting_intel`, plus feature pipeline blocks routed by ID) | Meeting tracking from Fathom AI, searchable summaries, action items, calendar view, "Send To" pipeline for proposals/lead magnets |
| **AI Employees** | `/modules/ai-employees.md` | 3 blocks (`employee_campaign_creator`, `employee_lead_table`, `employee_analytics`) | Turn sub-agents into SDRs with lead databases, 3-tier personalization campaigns, engagement analytics |
| **Lexa (Voice AI)** | `/modules/lexa-voice-ai.md` | 6 blocks (`lexa_dashboard`, `lexa_call_log`, `lexa_analytics`, `lexa_transcripts`, `lexa_campaigns`, `lexa_leads`) | AI phone agent via Millis AI -- inbound/outbound calls, transcripts with sentiment, cost tracking, campaign dialer |
| **Nova (Email AI)** | `/modules/nova-email-ai.md` | 6 blocks (`nova_dashboard`, `nova_outbox`, `nova_templates`, `nova_sequences`, `nova_campaigns`, `nova_analytics`) | AI email agent via Resend -- template library with {{variable}} personalization, multi-step sequences, open/click tracking |

---

## 3. AI EMPLOYEES

The system defines AI employees as **sub-agents with dedicated OpsCenter workspaces and animated office characters**. Each has three layers: identity (sub-agent record), workspace (OpsCenter app), and visual presence (2D office character).

### Named AI Employees

**Sherlock** -- Lead executor / build agent. The primary Claude Code agent. Handles full-stack development, API integrations, and autonomous builds. Has a green/yellow/red status ring on the dashboard. Uses the /autopilot 8-phase build loop and /done 8-step shutdown protocol.

**Ray** -- Coordinator / OpenClaw agent. The "night shift manager." Does not write code. Assigns tasks to executors, monitors progress via log polling, handles escalation, runs cross-QA, and generates morning reports.

**Lexa** -- AI Phone Employee. Powered by Millis AI. Handles inbound calls and runs outbound dialing campaigns. Captures full transcripts with sentiment analysis. Has 4 dedicated database tables (`lexa_calls`, `lexa_campaigns`, `lexa_leads`, `lexa_daily_metrics`) and 4 edge functions. Cost tracking per call with STT/TTS/LLM/platform breakdown.

**Nova** -- AI Email Employee. Powered by Resend. Sends personalized email sequences. Has 5 dedicated tables (`nova_templates`, `nova_sequences`, `nova_campaigns`, `nova_emails`, `nova_daily_metrics`). Tracks full email lifecycle: queued -> sending -> delivered -> opened -> clicked -> replied -> bounced. Supports multi-step sequences with delay conditions.

**PepperPots** -- Meeting Intelligence agent. Processes meeting recordings from Fathom AI, preps for upcoming meetings, extracts insights across conversations.

**Watson** -- Referenced as an example email marketer / communications executor.

**Researcher** -- Web research agent for competitor analysis and data gathering.

**Jason** -- Example AI SDR (Sales Development Rep) that manages leads and writes personalized cold emails.

Any sub-agent can be promoted to a full AI Employee by creating an OpsCenter app with the `employee_campaign_creator`, `employee_lead_table`, and `employee_analytics` blocks. Data is scoped by `app_id`, so multiple employees each get their own isolated workspace.

---

## 4. AUTONOMOUS ORCHESTRATION

### How Claude Code Works Autonomously

The system uses a **coordinator/executor architecture**. The coordinator (Ray/OpenClaw) never writes code -- it assigns work, monitors, and QAs. The executor (Sherlock/Claude Code) builds autonomously using an 8-phase loop.

### The /autopilot Loop (8 Phases)

1. **CONTEXT** -- Generate a `run_id` (UUID), emit `run_start` event, load project files, pull ClawBuddy state, check queue for dispatched work
2. **PLAN** -- Create implementation plan with discrete subtasks and dependency ordering
3. **TASK BOARD** -- Create Kanban task, assign agents, create subtasks
4. **BUILD** -- Execute plan step-by-step, log every major step, mandatory heartbeat every 5 minutes
5. **VALIDATE** -- Run TypeScript checks, build verification, API tests, database query verification
6. **HEAL** -- If validation fails, self-heal up to 5 attempts using known patterns from MEMORY.md
7. **REPORT** -- Generate HTML report, create insight card, extract learnings to Cognitive Memory
8. **CLOSE** -- Emit `run_end`, update STATUS.md, run alignment check, set status green

### What Triggers It

- Human queues tasks on the Kanban board during the day, then activates the coordinator at end of day
- Coordinator picks up tasks in priority order from the board
- Cross-agent dispatch via the queue system: Ray creates a queue item, Sherlock's session-start hook detects it
- The `/autopilot` slash command can be invoked directly

### Self-Improvement Mechanisms

- **Sherlock Brain** edge function runs periodic reflection cycles: reviews `agent_learning_log`, identifies patterns, consolidates learnings
- **Self-Evolution rules**: if the same error occurs 3+ times, the agent extracts a rule to MEMORY.md. User corrections trigger immediate CLAUDE.md/MEMORY.md updates. Every 5 self-modifications, the agent pauses for human review
- **Cognitive Memory submission**: agents submit discoveries (API quirks, preferences, patterns) for approval. Approved entries become permanent and load on every future session
- **Alignment scoring**: 12-check system grades agent health (0-100%) -- STATUS.md freshness, task assignment compliance, log activity, git cleanliness, hook configuration, etc.

### Safety Boundaries (The Autonomy Envelope)

Pre-approved (no human needed): reading files, writing code within scope, running builds/tests/lints, creating tasks, logging, git commits after validation, self-healing up to 5 attempts.

Requires human approval: deploying to production, database migrations, modifying .env files, deleting files, force pushing, sending external emails, spending money, modifying another agent's config.

### Kill Switch

Setting the agent status to offline with a red ring immediately halts all autonomous work. The coordinator checks status before assigning new tasks.

---

## 5. COGNITIVE MEMORY

### How It Works

Two complementary systems, both already built into the kit:

**Memory Submissions** (`request_type: "memory"`, `action: "submit"`) -- The agent submits knowledge entries with categories: `preference`, `decision`, `context`, `pattern`, `mistake`. These go to the dashboard owner for approval before becoming permanent. This human-in-the-loop gate prevents agents from polluting memory with noise.

**Agent Learning Log** (`agent_learning_log` table) -- Automatically populated by Sherlock Brain during self-improvement cycles. Tracks successful patterns, failed approaches, decision rationale, and performance data.

### What Makes It "Cognitive"

1. **Human-gated persistence**: Memory entries are submitted, reviewed, and approved -- not just dumped. The agent proposes; the human curates.

2. **Cross-session bridging**: At session start, Claude Code reads MEMORY.md (auto-loaded) + STATUS.md (loaded by session-start hook). During work, discoveries are logged. Before /compact, STATUS.md is updated so the next session has context. The chain: Session 1 writes STATUS.md -> gap -> Session 2 reads STATUS.md.

3. **Self-consolidation**: Sherlock Brain reviews the learning log periodically, identifies repeated patterns, and consolidates them. Example from the docs: 3 separate CSV-related learnings get consolidated into one refined pattern: "All file exports: stream if >5K rows, batch if >50K, always validate row count first."

4. **Five fallback sources if context is lost**: CLAUDE.md (always loaded), MEMORY.md (auto-loaded), STATUS.md (hook-loaded), ClawBuddy API (full history), git log (commit messages).

5. **Category taxonomy**: Unlike raw key-value memory, entries are typed (`preference`, `decision`, `context`, `pattern`, `mistake`) so the agent can reason about what kind of knowledge it is applying.

---

## 6. COMMAND CENTER

### Telegram Integration

The Telegram bot (deployed in `telegram-bot/` directory) provides a mobile command interface. It requires `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` environment variables.

**How commands flow:**
1. User sends a message to the Telegram bot from their phone
2. Bot processes the command and calls the ClawBuddy API (`ai-tasks` edge function)
3. Results are sent back to Telegram and simultaneously update the dashboard
4. Optional: Deepgram integration for voice transcription of voice messages

**Automation delivery channels:** Automations like Morning Digest and Evening Report can deliver to both `dashboard` and `telegram` channels simultaneously, configured via the `channels` JSONB array on each automation record.

**Auto-start:** macOS launchd plist keeps the bot running, restarting automatically on login.

### Command Flow Architecture

The full Command Center (documented in `command-center-orchestration.md`) is the most sophisticated module. It has 12 distinct parts:

**5 Session Intelligence Hooks** fire automatically on Claude Code lifecycle events:
- `session-start.sh` (SessionStart) -- Sets agent online, loads STATUS.md, pulls unread logs/questions/tasks, checks queue for dispatched work, detects orphaned runs
- `pre-compact-save.sh` (PreCompact) -- Forces agent to save state before context is lost
- `command-guard.sh` (PreToolUse:Bash) -- Blocks destructive commands using Python shlex parsing
- `typecheck.sh` (PostToolUse:Write|Edit) -- Auto-runs `tsc --noEmit` after .ts/.tsx edits
- `alignment-check.sh` (Manual) -- 12-check scoring system

**Cross-Agent Auto-Dispatch:** Ray creates a queue item + logs an `agent_dispatch` event. Sherlock's session-start hook checks the queue, surfaces pending items, and /autopilot Phase 1 claims them. Atomic handoff -- `queue.claim` is single-use, no double-pickup risk.

**Inter-Agent Messaging** (`agent_comms` table): Agents message each other with typed messages (`comment`, `question`, `status_request`, `status_response`, `directive`), threaded replies, priority levels, and read status tracking.

**pg_cron Watchdog:** A PostgreSQL function (`check_stale_progress()`) runs every minute, finds active runs without recent heartbeats (>10 min gap), and inserts `stale_progress` alerts. It is an observer only -- it never terminates runs.

---

## 7. KILLER FEATURES

**1. Make Work Visible -- The "If you can't see it on the dashboard, it didn't happen" principle.** Every AI action creates a dashboard artifact: Kanban cards, log entries, insight cards, HTML reports, status rings. This is not just logging -- it is real-time observability of AI work as it happens.

**2. Animated 2D Office.** AI agents are represented as animated characters in a virtual office. When Sherlock starts building, his character shows "busy" with thought bubbles showing what he is working on. This is visual storytelling that no other AI tool does.

**3. Overnight Autonomous Builds with Morning Reports.** The user queues tasks during the day, activates the coordinator at night, and wakes up to an HTML report showing completed tasks, blocked items, QA results, alignment scores, and extracted learnings. The coordinator handles task assignment, stall detection, cross-QA, and escalation entirely on its own.

**4. Self-Evolving Agent Configuration.** The agent modifies its own MEMORY.md and CLAUDE.md based on repeated errors and user corrections, with a human review gate every 5 changes. Over time, the agent gets better at working in YOUR specific codebase.

**5. The Autonomy Envelope as a Safety Boundary.** A formal, explicit list of what the agent can and cannot do without human approval. Not just a prompt -- it is enforced by the Command Guard hook (blocks destructive bash commands at the shell level using shlex parsing) and the question/approval workflow.

**6. AI Employees with Full Business Stacks.** Lexa makes phone calls with real voice AI, tracks costs per call, runs outbound campaigns. Nova sends personalized email sequences with open/click tracking. These are not toy demos -- they have lead databases, campaign builders, analytics dashboards, and real integrations (Millis AI, Resend).

**7. Cross-Agent Dispatch Without Human Relay.** Ray can assign work to Sherlock through the queue system, and Sherlock picks it up automatically at session start. No human telephone between agents.

**8. Alignment Scoring.** A 12-check health system that grades the agent's operational hygiene (STATUS.md freshness, task assignments, log activity, git state, hook configuration). Produces a letter grade (A/B/C/F) and pushes it as a dashboard insight card.

**9. The Lovable Prompt Template.** A standardized one-shot prompt that generates OpsCenter block components compatible with the full tech stack (React 18, shadcn/ui, Recharts, Supabase hooks). This is a component factory for building new dashboard modules.

**10. Session Intelligence Hooks as a Memory Bridge.** The pre-compact hook fires before Claude Code loses context and forces a state save. The session-start hook loads that state in the next session. This solves the fundamental problem of AI agents forgetting everything between conversations.

---

## 8. MASTERCLASS POTENTIAL -- Best On-Camera Demonstrations

### Tier 1: Show-Stoppers (Audience will say "I need this")

**Demo 1: "Watch My AI Build While I Sleep"**
- Queue 3-4 tasks on the Kanban board on camera
- Activate /autopilot
- Show the live Autopilot Tracker with phase dots progressing, heartbeat progress bar, elapsed time counter
- Time-lapse the Kanban cards moving from To Do -> Doing -> Done
- Show the morning report appearing on the dashboard
- File: `/modules/autonomous-orchestration.md`, `/modules/command-center-orchestration.md`

**Demo 2: "My AI Employee Just Made a Phone Call"**
- Show Lexa's dashboard at zero
- Make a real inbound call to the Millis number
- Watch the call appear in real-time on the dashboard with transcript, sentiment, and cost breakdown
- Then launch a small outbound campaign (5 leads) and watch them get dialed
- File: `/modules/lexa-voice-ai.md`, `/docs/lexa-setup-guide.md`

**Demo 3: "The Animated AI Office"**
- Show the 2D animated office with agent characters
- Trigger Sherlock to start a build -- watch his character change status and show thought bubbles
- Add a second agent (Jason the SDR) and watch both working simultaneously
- This is the most visually compelling feature for social media clips
- File: CLAUDE.md (Animated Office System section)

### Tier 2: High-Impact Demos

**Demo 4: "Send 100 Personalized Emails in 60 Seconds"**
- Show Nova's template editor with {{variable}} pills
- Build a 3-step sequence (intro -> follow-up -> breakup)
- Launch a campaign against a lead list
- Watch the Outbox fill up, open rate update in real-time
- File: `/modules/nova-email-ai.md`, `/docs/nova-setup-guide.md`

**Demo 5: "My AI Remembers Everything"**
- Show a session where the agent discovers an API quirk
- Submit it as a cognitive memory entry
- Approve it on the dashboard
- Start a fresh session -- show the agent loading the memory and applying it automatically
- File: `/modules/cognitive-memory.md`

**Demo 6: "Command My AI From My Phone"**
- Open Telegram on phone
- Send a task to the bot
- Watch it appear on the Kanban board in real-time on the laptop dashboard
- Get the Morning Digest delivered to Telegram
- File: `/modules/supercharge-claude-code.md`

### Tier 3: Deep Dives (For longer-form content)

**Demo 7: "YouTube Intelligence Dashboard"**
- Show Creator Command with competitor tracking, outlier video detection, "Banger Lab" idea scoring
- Run the competitor intel automation and watch fresh data appear
- Walk through the content pipeline (Idea -> Script -> Film -> Edit -> Published)
- File: `/modules/creator-command.md`

**Demo 8: "The Self-Improving Agent"**
- Show the alignment scoring system running (12 checks)
- Demonstrate self-evolution: deliberately cause the same error 3 times and watch the agent extract a rule to MEMORY.md
- Show Sherlock Brain's reflection cycle consolidating learnings
- File: `/modules/command-center-orchestration.md` (Parts 7-8)

**Demo 9: "Zero to AI Command Center in 20 Minutes"**
- Speed-run the SETUP.md from empty Supabase project to working dashboard
- Deploy all 25 edge functions
- Connect Claude Code via CLAUDE.md
- Send the first status update and watch the ring turn green
- File: `/SETUP.md`

---

## Key Files Referenced in This Report

- `CLAUDE.md`
- `README.md`
- `SETUP.md`
- `modules/autonomous-orchestration.md`
- `modules/command-center-orchestration.md`
- `modules/cognitive-memory.md`
- `modules/ai-employees.md`
- `modules/creator-command.md`
- `modules/lexa-voice-ai.md`
- `modules/nova-email-ai.md`
- `modules/meeting-intelligence.md`
- `modules/skill-library.md`
- `modules/supercharge-claude-code.md`
- `docs/integration-guide.md`
- `docs/lexa-setup-guide.md`
- `docs/nova-setup-guide.md`
- `lovable-prompts/TEMPLATE.md`
