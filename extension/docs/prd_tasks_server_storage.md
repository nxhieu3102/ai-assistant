# Summary
The Tasks feature currently persists data in `chrome.storage.local` inside the browser.  
This PRD describes **Phase 2: Server-side persistence** – migrating all task data to a
simple JSON file located in the server (`server/temp/tasks.json`).  
The goal is to enable seamless cross-device availability, simplify future backup &
analytics work, and lay the groundwork for eventually moving to a database.

---

# Task List

| ID       | Description                                                                                       | Change Scope                                   | Completed | Dependency |
|----------|---------------------------------------------------------------------------------------------------|------------------------------------------------|-----------|------------|
| **BE-001** | Create `TaskRepo` abstraction for file read/write with atomic saves                              | `server/src/repository/TaskRepo.ts`            | [✅]       | —          |
| **BE-002** | Implement CRUD service layer (`TaskService`)                                                     | `server/src/services/TaskService.ts`           | [✅]       | BE-001     |
| **BE-003** | Expose REST endpoints:<br/>• `GET /tasks` (query by date)<br/>• `POST /tasks`<br/>• `PUT /tasks/:id`<br/>• `DELETE /tasks/:id` | `server/src/routes/taskRoutes.ts` + controller | [✅]       | BE-002     |
| **BE-004** | Daily migration job: move unfinished tasks → today, prune >30 day history                        | `TaskService.migrate()`                        | [✅]       | BE-002     |
| **BE-005** | Front-end integration: swap `taskStorage.ts` with fetch calls                                    | `extension/src/components/Tasks/*`             | [✅]       | BE-003     |
| **BE-006** | Backup & recovery logic (ring buffer of 10 backups)                                              | `TaskRepo`                                     | [✅]       | BE-001     |
| **BE-007** | Concurrency guard (file lock)                                                                    | `TaskRepo`                                     | [✅]       | BE-001     |
| **BE-008** | Update i18n strings for new error states                                                         | `extension/src/services/i18n.ts`               | [✅]       | BE-005     |
| **BE-009** | Documentation & API reference                                                                    | `/docs`                                        | [ ]       | BE-003     |

---

# Implementation Status
**Start Date:** 2025-08-03  
**Target Completion:** 2025-08-03  
**Current Progress:** 89% (server and frontend integration complete)

---

# 🏗️ Architecture Overview

## Component Structure
```
server/
├── src/
│   ├── repository/
│   │   └── TaskRepo.ts          # File-based persistence (atomic, locked)
│   ├── services/
│   │   └── TaskService.ts       # Business logic, migration, validation
│   ├── controllers/
│   │   └── TaskController.ts    # Express handlers
│   └── routes/
│       └── taskRoutes.ts        # /tasks router
└── temp/
    └── tasks.json               # Live data file (git-ignored)
extension/
└── src/services/
    └── taskApi.ts               # Fetch wrapper (replaces taskStorage.ts)
```

## JSON Schema
```jsonc
{
  "version": 1,
  "lastMigration": "ISO_TIMESTAMP",
  "days": {
    "YYYY-MM-DD": [
      {
        "id": "ULID",
        "text": "Task content",
        "completed": false,
        "createdAt": "ISO_TIMESTAMP",
        "updatedAt": "ISO_TIMESTAMP"
      }
    ]
  }
}
```

---

# API Design

| Method | Endpoint            | Description                     | Query / Body                                  |
|--------|---------------------|---------------------------------|-----------------------------------------------|
| GET    | /tasks?date=YYYY-MM-DD | List tasks for date            | `date` optional, default = today              |
| POST   | /tasks              | Create task                     | `{ text }`                                    |
| PUT    | /tasks/:id          | Update / toggle                 | `{ text?, completed? }`                       |
| DELETE | /tasks/:id          | Remove task                     | —                                             |

Responses use the shared `ResponseData` shape.

---

# Validation Rules
1. `text` must be non-empty and ≤ 140 chars.  
2. Reject duplicate `id`.  
3. Unrecognised fields are ignored (forward compatibility).

---

# Security & Concurrency
• File-level lock via `proper-lockfile` to avoid race conditions during
parallel requests.  
• The `temp/` folder is **.gitignored** to prevent accidental commits.  
• Input sanitisation on the server prevents script injection.

---

# Success Metrics
| Metric                           | Target |
|----------------------------------|--------|
| API p95 latency (CRUD)           | < 50 ms |
| Data loss incidents              | 0      |
| Backup integrity (monthly test)  | 100 %  |
| Front-end regression bugs        | 0      |

---

# Future Development
1. **SQLite migration** – same repository interface, drop-in replacement.  
2. **Cloud sync** – optional user account & OAuth.  
3. **Task analytics** – completion rate, streaks.  
4. **Real-time push** – WebSocket broadcast on task changes.

---

*Document version 0.1 – generated 2025-08-03* 
