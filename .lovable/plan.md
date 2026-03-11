

# Visual Overhaul Plan — Million-Dollar SaaS Upgrade

## Overview

Transform Agent Command Hub from a tabbed single-page dashboard into a sidebar-driven SaaS application with enhanced glass-morphism, glow effects, and premium interactions throughout.

## Architecture Change

```text
Current:
┌─────────────────────────────────┐
│ Header                          │
│ [Tab1] [Tab2] [Tab3] ...       │
│ Content                         │
└─────────────────────────────────┘

New:
┌────────┬────────────────────────┐
│ Sidebar│ Header (breadcrumb,    │
│ Logo   │ search, notifications) │
│ Nav    │────────────────────────│
│ Items  │                        │
│        │ Content                 │
│ Agent  │                        │
│ Status │                        │
│ Footer │                        │
└────────┴────────────────────────┘
```

## Files to Create/Modify

### 1. New: `src/components/AppSidebar.tsx`
- Collapsible sidebar using shadcn `Sidebar` component
- Top: Agent Command Hub logo + branding with emerald glow
- Navigation items for all 6 sections (Command Deck, Agents, Tasks, AI Log, Council, Meetings) with Lucide icons and active state highlighting
- Bottom section: mini agent status panel (3 dots showing active/idle/error)
- Glass-morphic background, border-right glow accent
- Collapsed state shows icons only

### 2. New: `src/components/AppLayout.tsx`
- Wraps `SidebarProvider` + `AppSidebar` + main content area
- Replaces the tab-based navigation with route-like state (still single page, using state to switch views)

### 3. Modify: `src/pages/Index.tsx`
- Remove `Tabs` component, use `AppLayout` with sidebar-driven navigation
- Content area renders based on `activeSection` state passed from sidebar
- Add a refined top header bar with: breadcrumb showing current section, global search input, notification bell with badge, user avatar placeholder

### 4. Modify: `src/components/Header.tsx`
- Redesign as a top bar within the main content area (not the full-width header)
- Add: SidebarTrigger, breadcrumb trail, global search bar (glass input), notification bell icon with unread count badge (mock: 3), settings gear
- Keep agent status indicator but make it more compact

### 5. Modify: `src/index.css` — Enhanced Animations & Glass Effects
- Add new CSS classes:
  - `.glass-card-glow` — glass card with animated border glow on hover (emerald gradient border)
  - `.glass-sidebar` — sidebar-specific glass styling with stronger blur
  - `.glow-border-hover` — animated border that transitions from transparent to emerald on hover
  - `.shimmer` — subtle shimmer/shine animation for premium feel on metric cards
  - `@keyframes glow-pulse` — pulsing glow for active nav items
  - `@keyframes border-glow` — rotating gradient border animation
  - `.nav-item-active` — active sidebar item with left emerald border + subtle bg glow

### 6. Modify: `src/components/GlassCard.tsx`
- Add `glow` prop option for cards that get the animated border glow on hover
- Enhance hover state: border color transitions to emerald/cyan, shadow intensifies

### 7. Modify: `src/components/MetricCard.tsx`
- Add shimmer/shine animation on hover
- Larger icon area with gradient background
- Animated number counter effect (already partially there)

### 8. Enhance All Tab Components
- **CommandDeck**: Add gradient dividers between sections, activity items get left-border color accent on hover
- **AgentProfiles**: Cards get rotating gradient border on hover, add a subtle particle/dot pattern background to each card, stats get micro-animations
- **TaskBoard**: Column headers get glow underline for active column, cards get colored left border by priority
- **AILog**: Log entries get a timeline connector (vertical line on left), category badges glow
- **Council**: Session cards get status-colored glow (active=cyan, completed=emerald), message bubbles get subtle glass effect
- **MeetingIntelligence**: Charts get glass container treatment, meeting cards get type-colored left border

### 9. Modify: `tailwind.config.ts`
- Add animation keyframes for `shimmer`, `glow-pulse`, `border-glow`
- Add `glass-sidebar` bg color variant

## Key Design Decisions
- Navigation via sidebar state (not react-router routes) to keep it single-page
- Sidebar collapses to icon-only on mobile via shadcn sidebar `collapsible="icon"`
- All existing mock data stays unchanged — purely visual changes
- Every interactive element gets a hover glow/transition upgrade

## Implementation Scope (Single Phase)
All items above will be built in one pass: sidebar, header redesign, CSS enhancements, and component-level polish across all 6 tabs.

