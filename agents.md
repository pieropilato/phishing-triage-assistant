# agents.md

Instructions for any coding agent (Cursor, Codex, Copilot, Claude Code and others).
`CLAUDE.md` has the full project context; this file is the short, tool-neutral version.

## Before you change code

- Read `spec.md` (behaviour and acceptance criteria) and `CLAUDE.md` (rules).
- Plan first for anything that touches `lib/signals.ts`, `lib/ai.ts` or the API route.

## Definition of done

- `npm run lint && npm run typecheck && npm test && npm run build` all pass.
- New behaviour has a unit test in `tests/`.
- No secret, key or real email content is added to the repo.
- `spec.md` is updated if behaviour changed.

## Hard limits

- Do not hardcode API keys or add default keys.
- Do not fetch, resolve or open URLs taken from a submitted email.
- Do not log or store submitted email content.
- Do not let the model verdict bypass `applyGuardrail`.
- Do not commit directly generated files (`.next/`, `node_modules/`).

## Commit style

Small commits, imperative subject line, e.g. `Add reply-to mismatch rule`.
