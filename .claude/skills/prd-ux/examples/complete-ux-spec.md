# UX Specification: Task Manager App

A complete example of a 6-pass UX specification following the prd-ux workflow.

---

## Pass 1: Mental Model

**Primary user intent:** Keep track of tasks and feel accomplished when completing them.

**Likely misconceptions:**

1. "Deleting a task means it's gone forever" → Reality: Tasks go to trash, recoverable for 30 days
2. "Due dates are just reminders" → Reality: Overdue tasks affect productivity score
3. "Projects are like folders" → Reality: A task can belong to multiple projects

**UX principles to reinforce:**

- Tasks are fluid, not permanent commitments (easy to reschedule, archive, delete)
- Completion is celebrated, not just checked off
- Organization is optional, not required (can use without projects)

**Terminology audit:**
| Term We Use | User Might Think | Clarification Needed |
|-------------|------------------|----------------------|
| "Archive" | Deleted | "Archived tasks can be restored" |
| "Project" | Folder | Show multi-project badge |
| "Due date" | Optional reminder | Show overdue indicator |

---

## Pass 2: Information Architecture

**All user-visible concepts:**

- Tasks (the core unit)
- Projects (groupings of tasks)
- Labels (tags for filtering)
- Due dates (deadlines)
- Priority (importance levels)
- Comments (notes on tasks)
- Subtasks (nested tasks)
- Recurring (repeating tasks)
- Archive (completed/hidden tasks)
- Today view (tasks due today)
- Upcoming view (future tasks)
- Inbox (unsorted tasks)

**Grouped structure:**

### Task Management (Primary)

- Tasks: Primary — core interaction
- Subtasks: Secondary — power user feature
- Comments: Secondary — on task detail only

### Organization (Secondary)

- Projects: Primary — visible in sidebar
- Labels: Secondary — visible on filter menu
- Priority: Secondary — inline on task

### Time (Primary)

- Today view: Primary — default view
- Upcoming: Primary — sidebar nav
- Due dates: Primary — inline on task
- Recurring: Hidden — in task detail

### Archive (Hidden)

- Archive: Hidden — in menu
- Trash: Hidden — in settings

**Navigation structure:**

```
Sidebar:
├── Inbox (unsorted)
├── Today (due today)
├── Upcoming (next 7 days)
├── Projects
│   ├── Project A
│   └── Project B
└── Labels (collapsed)

Header:
├── Search
├── Add Task (+)
└── Profile
```

---

## Pass 3: Affordances

| Element        | Action              | Visual Signal            | Touch Target       |
| -------------- | ------------------- | ------------------------ | ------------------ |
| Task row       | Open detail         | Hover highlight, pointer | Full row           |
| Checkbox       | Complete task       | Circle → checkmark       | 44x44px            |
| Due date chip  | Change date         | Hover underline          | Chip + 8px padding |
| Priority flag  | Change priority     | Color indicates level    | 32x32px expanded   |
| Add button (+) | Create new task     | Filled circle, + icon    | 56x56px            |
| Project name   | Navigate to project | Hover underline          | Full text          |
| Drag handle    | Reorder task        | ⋮⋮ icon, grab cursor     | 24x44px            |

**Affordance rules:**

- Circle = toggleable (checkbox, completion)
- Chip = editable inline (date, label)
- Text with underline on hover = navigation
- Icon button = action
- Drag handle visible = reorderable

**State indicators:**
| State | Visual Treatment |
|-------|------------------|
| Incomplete task | Empty circle, normal text |
| Complete task | Filled checkmark, strikethrough |
| Overdue | Red date chip |
| High priority | Red flag icon |
| Has subtasks | Chevron + count |
| Has comments | Comment icon + count |

---

## Pass 4: Cognitive Load

**Friction points:**

| Moment             | Type        | Current Friction    | Simplification              |
| ------------------ | ----------- | ------------------- | --------------------------- |
| Creating task      | Choice      | Full form shown     | Quick add (title only)      |
| Setting due date   | Choice      | Calendar picker     | Natural language "tomorrow" |
| Choosing project   | Choice      | All projects listed | Recent + search             |
| Priority selection | Choice      | 4 levels            | Default to "none"           |
| First-time use     | Uncertainty | Empty state         | Sample project              |

**Defaults introduced:**

- Default view: Today
- Default priority: None
- Default project: Inbox (no project)
- Default due date: None

**Progressive disclosure:**
| Initially Hidden | Shown When |
|------------------|------------|
| Subtasks | Tap chevron |
| Comments | Open task detail |
| Labels | Open filter menu |
| Recurring options | Open task detail |
| Archive | Access via menu |

**Memory aids:**

- Persistent task count badges
- "Recently viewed" in search
- Last used project highlighted

---

## Pass 5: State Design

### Task List

| State        | User Sees                 | User Understands | User Can Do                 |
| ------------ | ------------------------- | ---------------- | --------------------------- |
| Empty        | Illustration + "No tasks" | Nothing to do    | Add task or browse projects |
| Loading      | Skeleton rows             | List loading     | Wait                        |
| Has tasks    | Task rows                 | Work to do       | Interact with tasks         |
| All complete | Celebration + "All done!" | Great job        | Review completed            |
| Error        | Error banner              | Failed to load   | Retry                       |

### Task Creation

| State          | User Sees                | User Understands | User Can Do        |
| -------------- | ------------------------ | ---------------- | ------------------ |
| Quick add open | Input focused            | Can type task    | Enter title        |
| Typing         | Text + suggestions       | Can add details  | Complete or expand |
| Saving         | Spinner                  | Creating task    | Wait               |
| Success        | Task in list + highlight | Task created     | Continue           |
| Error          | Shake + error            | Something failed | Fix and retry      |

### Task Completion

| Stage              | Visual            | Duration | Next          |
| ------------------ | ----------------- | -------- | ------------- |
| Tap checkbox       | Circle fills      | 100ms    | Animate       |
| Checkmark appears  | ✓ draws           | 200ms    | Strikethrough |
| Text strikethrough | Line draws        | 200ms    | Celebrate     |
| Celebration        | Confetti (subtle) | 500ms    | Fade/move     |
| Move to complete   | Slide/fade        | 300ms    | List updates  |

---

## Pass 6: Flow Integrity

**Flow risks:**

| Risk                     | Location     | Impact              | Mitigation           |
| ------------------------ | ------------ | ------------------- | -------------------- |
| Accidental completion    | Checkbox tap | Undo needed         | 5s undo toast        |
| Data loss on crash       | Task entry   | Lost work           | Auto-save drafts     |
| Wrong project assignment | New task     | Misorganization     | Confirm on blur      |
| Missed overdue           | Today view   | Missed deadline     | Badge + notification |
| Delete vs archive        | Task menu    | Unintended deletion | Confirm dialog       |

**Visibility decisions:**

Must be visible always:

- Task count badges
- Current view name
- Add task button
- Navigation sidebar

Can be implied/hidden:

- Archive access
- Trash/deleted items
- Advanced filters
- Recurring settings
- Bulk operations

**UX constraints for visual phase:**

1. Checkbox must be minimum 44x44px touch target
2. Complete animation must not exceed 1 second total
3. Undo must be available for 5 seconds after completion
4. Quick add must not require more than 1 tap to open
5. Overdue indicator must be visible without hovering

---

## Visual Specifications

_Only after all 6 passes complete_

### Layout

```
┌─────────────────────────────────────────────┐
│ Header (56px)                               │
│  [☰] Today              [🔍] [+] [👤]       │
├─────────────────────────────────────────────┤
│ Sidebar    │ Main Content                   │
│ (240px)    │                                │
│            │ ┌─────────────────────────────┐│
│ Inbox (3)  │ │ Quick Add Input             ││
│ Today (5)  │ └─────────────────────────────┘│
│ Upcoming   │                                │
│            │ ┌─────────────────────────────┐│
│ Projects   │ │ ○ Task 1          Today  🔴 ││
│  Work (8)  │ │ ○ Task 2          Tomorrow  ││
│  Personal  │ │ ✓ Task 3 (done)            ││
│            │ └─────────────────────────────┘│
└────────────┴────────────────────────────────┘
```

### Component Specs

**Task Row:**

- Height: 48px
- Padding: 12px 16px
- Checkbox: 20px circle, 44px touch target
- Title: 14px, weight 400
- Due date: 12px, right aligned
- Hover: Background #F5F5F5

**Quick Add:**

- Height: 48px
- Border: 1px solid #E0E0E0
- Focus: Border #1976D2, shadow
- Placeholder: "Add a task..."

**Completion Animation:**

- Circle fill: 100ms ease-out
- Checkmark draw: 200ms ease-out
- Strikethrough: 200ms ease-out
- Confetti: 500ms (4 particles)
- Fade/move out: 300ms ease-in

### Responsive Breakpoints

| Breakpoint | Sidebar            | Layout        |
| ---------- | ------------------ | ------------- |
| < 640px    | Hidden (hamburger) | Single column |
| 640-1024px | Collapsed (icons)  | Two column    |
| > 1024px   | Full width         | Two column    |

---

## Handoff Notes

**For mockup tools (Stitch/Figma):**

1. Start with Today view (default)
2. Include all 5 task row states
3. Show quick add expanded and collapsed
4. Demonstrate completion animation frames
5. Include empty state with onboarding

**For development:**

1. Checkbox requires 44px touch target despite 20px visual
2. Completion animation is not optional (core UX)
3. Undo toast must persist for 5s and be dismissable
4. Auto-save drafts to localStorage during quick add
