# Summary  
Building on the **completed multi-tab foundation**, we will now implement a full-featured Pomodoro timer to replace the current placeholder in the **Pomo** tab.  
Core capabilities:  
• 25-minute focus / 5-minute short breaks / auto long breaks every four cycles  
• Desktop notifications & sound alerts  
• Timer continues when popup closes (background script)  
• Customisable durations & long-break interval  
• **Statistics:** daily totals, weekly trend chart, and reset/export options.

**Foundation Already Complete:** Tab system, keyboard navigation, i18n infrastructure, and accessibility patterns are established.

---

# Task List

- PO-001:
  + description: Replace PomoPlaceholder with actual PomodoroTimer UI (count-down, Start/Pause/Reset, cycle indicator).
  + what will change: Update `src/components/PomoPlaceholder.tsx` → `PomodoroTimer.tsx` with timer interface using existing i18n and accessibility patterns.
  + completed: [✅]
  + dependency: []

- PO-002:
  + description: Implement timer logic with React hooks (count-down, session/break detection, cycle tracking).
  + what will change: Add `src/hooks/usePomodoro.ts`; integrate with existing keyboard navigation system.
  + completed: [✅]
  + dependency: [PO-001]

- PO-003:
  + description: Keep the timer running when popup closes using background scripts.
  + what will change: Extend existing `background/index.ts` with shared timer state via `chrome.alarms`; set up message passing.
  + completed: [✅]
  + dependency: [PO-002]

- PO-004:
  + description: Display desktop notifications and play a short sound when a session or break ends.
  + what will change: Use `chrome.notifications`; add sound to `public/audio/`; hook into timer events with i18n support.
  + completed: [✅]
  + dependency: [PO-003]

- PO-005:
  + description: Provide a settings modal to customise focus length, break length, long-break interval.
  + what will change: Add `PomodoroSettings.tsx` using existing accessibility patterns; store in `chrome.storage.sync`; integrate with established i18n system.
  + completed: [✅]
  + dependency: [PO-002]

- PO-006:
  + description: Persist running timer state (remaining seconds, mode) following existing storage patterns.
  + what will change: Create `src/services/pomodoroStorage.ts` similar to `taskStorage.ts`; persist to `chrome.storage.local`.
  + completed: [✅]
  + dependency: [PO-003]

- PO-007:
  + description: Add Pomodoro strings to existing i18n system for all 10 supported languages.
  + what will change: Extend `src/services/i18n.ts` with timer-related keys; follow established translation patterns.
  + completed: [✅]
  + dependency: [PO-001]

- PO-008:
  + description: Ensure accessibility following established patterns—keyboard operation, ARIA labels, focus management.
  + what will change: Apply existing accessibility patterns from Tasks components; integrate with `useKeyboardNavigation.ts`.
  + completed: []
  + dependency: [PO-001]

- PO-009:
  + description: Collect session data (focus minutes, sessions completed) and store per-day following task storage patterns.
  + what will change: Extend `usePomodoro.ts` to emit `sessionEnd` events; create daily storage keys like `pomodoro:<YYYY-MM-DD>`.
  + completed: [✅]
  + dependency: [PO-002]

- PO-010:
  + description: Build Statistics view showing today's totals and a 7-day bar chart.
  + what will change: Create `src/components/Pomodoro/StatsView.tsx`; use lightweight chart library; follow existing component patterns.
  + completed: [✅]
  + dependency: [PO-009]

- PO-011:
  + description: Add internal tab-switcher inside Pomo tab to toggle between "Timer" and "Stats".
  + what will change: Create internal tabs within `PomodoroTimer.tsx` using similar patterns to main `Tabs.tsx`.
  + completed: [✅]
  + dependency: [PO-010]

- PO-012:
  + description: Provide export (JSON) and reset buttons inside Statistics view.
  + what will change: Add buttons in `StatsView.tsx`; implement helpers in `pomodoroStorage.ts` following task storage patterns.
  + completed: [✅]
  + dependency: [PO-010] 
