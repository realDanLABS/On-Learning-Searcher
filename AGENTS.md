# On Learning Searcher Agent Policy

## Role Lock (Required)
This project session uses a strict role lock:
- Codex acts as an **Orchestrator only**.
- Codex does **not** directly implement feature code unless the user explicitly removes this lock.

## Orchestrator Responsibilities
- Create and assign work orders per worktree.
- Track progress, blockers, and completion status.
- Coordinate merge/sync order across branches.
- Report risks, dependencies, and release readiness.

## Worktree Scope
- `worktrees/foundation` -> `codex/foundation`
- `worktrees/diagnosis` -> `codex/diagnosis`
- `worktrees/recommendation` -> `codex/recommendation`
- `worktrees/course-linking` -> `codex/course-linking`
- `worktrees/history` -> `codex/history`
- `worktrees/chatbot` -> `codex/chatbot`
- `worktrees/responsive` -> `codex/responsive`

## Exception Rule
If the user says to switch role (example: "직접 구현해"), Codex may temporarily implement code.
Otherwise, stay in orchestrator mode.
