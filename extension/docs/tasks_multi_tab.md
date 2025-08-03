# Summary
We are evolving the current single-tab “Translate” browser extension into a multi-tab productivity hub.  
The first release adds two new tabs:
• **Tasks** – a lightweight, local, day-specific to-do list with checkboxes and persistence.  
• **Pomo** – a placeholder tab that will later host a Pomodoro timer.  
The goals are to provide seamless tab switching, maintain a consistent UI, and lay groundwork for future productivity features.

---

# Task List

- FE-001:
  + description: Build a reusable `Tabs` component and integrate it into the popup layout.
  + what will change: Create `src/components/Tabs.tsx`; update `popup/index.tsx` to render three tabs and manage active-tab state.
  + completed: [✅]
  + dependency: []

- FE-002:
  + description: Create the "Tasks" view with input box, list rendering, and checkbox toggle.
  + what will change: Add `src/components/Tasks/TaskInput.tsx`, `TaskItem.tsx`, and parent `Tasks.tsx`; include tailwind/ CSS for list styling.
  + completed: [✅]
  + dependency: [FE-001]

- FE-003:
  + description: Persist today's tasks to `chrome.storage.local` using key `tasks:<YYYY-MM-DD>`. And move all tasks from previous day to today.
  + what will change: Implement storage helpers in `src/services/taskStorage.ts`; update `Tasks.tsx` to load/save on change.
  + completed: [✅]
  + dependency: [FE-002]

- FE-005:
  + description: Implement basic keyboard navigation: Ctrl+1/2/3 (or Cmd on macOS) to switch tabs.
  + what will change: Add key-listener hook in `popup/index.tsx` and update active-tab state accordingly.
  + completed: []
  + dependency: [FE-001]

- FE-006:
  + description: Create the “Pomo” placeholder component with “Pomodoro timer coming soon” message.
  + what will change: Add `src/components/PomoPlaceholder.tsx`; wire into tab routing.
  + completed: []
  + dependency: [FE-001]

- FE-007:
  + description: Internationalize all new UI strings (English & Vietnamese) via existing i18n utilities.
  + what will change: Update `src/i18n.ts` (or messages JSON), add keys for “Tasks”, “Pomo”, placeholders, and button tooltips.
  + completed: []
  + dependency: [FE-002, FE-006]

- FE-009:
  + description: Ensure accessibility – focus states, ARIA labels, and color-contrast compliance.
  + what will change: Audit components; update classNames/CSS and add ARIA attributes where missing.
  + completed: []
  + dependency: [FE-002, FE-006]
