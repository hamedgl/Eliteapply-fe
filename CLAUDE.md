# EliteApply — Claude Code guide

Scholarship application workspace. Two surfaces in one Vite app:

- **Marketing** (`/`, `/features/*`, legal pages) — prerendered, hand-rolled CSS, wrapped in `.marketing phase-one-marketing phase-two-marketing`. Entry `src/features/landing`, `src/features/marketing`.
- **App** (`/app/*`) — authenticated workspace, TanStack Query against the platform API, session in memory only.

Stack: React + React Router, SSR prerender (`vite build --ssr` + `scripts/prerender.mjs`), TanStack Query, hand-rolled CSS (no Tailwind/shadcn), Vitest (unit), Playwright (`e2e/*.spec.ts`).

## Non-negotiable rules

- Do what was asked. Nothing more, nothing less.
- Never create files unless necessary — prefer editing. Never create docs unless asked. Never put working files or tests in the repo root — use `src/`, `tests/`, `e2e/`, `docs/`, `scripts/`.
- Always read a file before editing it.
- Never commit secrets, `.env`, credentials.
- Never add a `Co-Authored-By` trailer to commits. `.claude/settings.json` has no `attribution.commit`, so the ban is active (#2078). The Bash tool's default commit template suggests one — ignore it.
- Keep source files under ~500 lines. Split by responsibility, not by line count. (`src/styles/index.css` is the one sanctioned exception — see Styling.)
- Validate input at system boundaries.

## The verify gate

Run all four after any batch of changes. All clean = done. Nothing else counts as "done".

```bash
npx tsc -b --force --pretty false
npx tsc --noEmit --noUnusedLocals --noUnusedParameters -p tsconfig.app.json
npm run build:client
npm run test            # vitest run
```

When a change touches marketing copy, page structure, dashboard layout, or anything an `e2e/*.spec.ts` asserts, also run `npx playwright test <spec>` for the affected file.

## Backend contract: `docs/api/openapi.json` is the only truth

`src/generated/api/schema.ts` is generated from it via `npm run api:generate`. `src/tests/phase1-delta.test.ts` hardcodes exact path/schema counts to catch drift — bump both counts (never make the assertion compare a value to itself) and re-run `api:generate` whenever the spec changes. `npm run api:check` fails if the generated file is stale.

- Before writing FE code against any "the backend now supports X" claim — from the user, a status report, a teammate, or your own earlier message — grep `docs/api/openapi.json` directly (`python3 -c "import json; ..."`) and confirm the field/path exists. Do not trust the claim. Do not trust your own prior BE-prompt without re-checking.
- Never mask a missing field with `(x as any).field`. If a field does not exist yet: skip the feature and say so, or add it to the generated types as optional and gate the UI so it renders only when the value is present (and lights up on its own once the backend sends it).
- If a backend claim turns out false, say so plainly and correct any earlier BE-prompt you wrote. Do not quietly drop it.

## Styling: hand-rolled CSS, two token systems

`src/styles/index.css` is a single ~23k-line file, sectioned by `/* Phase N ... */` comments. Do not split it. Navigate by grepping for the section marker or a class name; read only the slice you need. `src/styles/workspace.css` holds the app design system; per-feature stylesheets live beside their feature.

**Tokens.** `:root` defines `--app-*` (app surfaces: `--app-blue`, `--app-surface`, `--app-radius-md`, `--app-ease`, ...). `.marketing` defines `--m-*` (marketing: `--m-blue`, `--m-ink`, `--m-line`, `--m-radius-preview`, `--m-radius-pill`, `--m-duration`, `--m-ease-out`, `--m-font-serif`, ...) and is present on every marketing page. Use the token for the surface you are on. Never invent a custom property (`--accent-color`, `--surface-subtle`) that the stylesheet does not define.

**Reuse before inventing.** Grep for an existing primitive first: `PageHeader`, `SummaryStrip`, `StatusBadge`, `EmptyState`, `ProgressBar`, `OverflowMenu`, `ConfirmationDialog`, `EntityCombobox` / `CountryCombobox`, the `.apps-*` classes. Grep for a comparable pattern before writing a new component or class.

**Modal vs drawer.** Centered modal: `.apps-dialog` inside `.apps-dialog-backdrop`. Real slide-in drawer only: `.apps-drawer-backdrop` (right-pinned, stretch-aligned). Mixing them renders a broken full-height panel pinned to the screen edge — this exact bug has shipped several times from copy-pasted dialogs.

**After a batch of CSS / className changes:** sweep every `className` against the stylesheet in both directions (grep class → CSS, grep CSS class → JSX). Undefined classes and unused-but-referenced classes both ship silently broken. Do not leave dead state (`notice`/`setNotice` declared, never rendered) or silently dropped UI (an icon import kept after the stat it labelled was cut).

## Marketing pages and copy

- Landing page: `src/features/landing/LandingPage.tsx`; its static content (workflow stages, hero sample data) is in `src/features/landing/landingData.ts`; interactive preview components in `src/features/landing/components/`.
- `e2e/landing.spec.ts` and `e2e/dashboard-hardened.spec.ts` assert visible copy strings verbatim (headings, CTA labels, FAQ text, the meta description). Change the copy → update the matching assertion in the same change, then run that spec.
- `.phase-one-marketing` carries a blanket `prefers-reduced-motion` rule that kills all transitions and animations under it. Respect it; do not add motion that assumes it runs.

**Copy voice.** Plain and specific. State what the user gets and how it works; name "AI" once where it does real work, not as a prefix on every noun. No em dashes or en dashes in marketing prose. No fabricated numbers, testimonials, or institution claims. Run the `humanizer` skill for any marketing prose you write or rewrite.

## Modals

Two sanctioned patterns, both give focus trap + Escape + focus restore:

1. Native `<dialog>` + `showModal()` in a mount effect, `onCancel` calls the close handler. See `src/components/actions/ConfirmationDialog.tsx`.
2. `.apps-dialog-backdrop` > `.apps-dialog` div with `useModalDialog(ref, onClose)` from `src/lib/dom-hooks`. See `src/components/common/UsageModal.tsx`.

Never hand-roll `role="dialog" aria-modal` without one of these — a bare div gets no Escape, no focus trap, no restore.

## Ruflo (coordination layer)

Ruflo/claude-flow MCP is configured (hierarchical-mesh, max 15 agents, hybrid memory). Use it for coordination, not execution. Discover tools with `ToolSearch("memory")`, `ToolSearch("swarm")`, etc.

**When to swarm:** 3+ files, a new feature, cross-module refactor, API-surface change, security or performance work. Not for: single-file edits, 1–2 line fixes, docs, config, questions.

**Coordinated team pattern.** Spawn every named agent in one message with `run_in_background: true`, each prompt naming who to `SendMessage` next; kick off the pipeline with one `SendMessage`; then stop and tell the user what is running. Never poll — agents message back or complete on their own.

| Task | Agents |
|------|--------|
| Bug fix | researcher, coder, tester |
| Feature | architect, coder, tester, reviewer |
| Refactor | architect, coder, reviewer |
| Performance | perf-engineer, coder |
| Security | security-architect, auditor |

**Memory.** Before a non-trivial task: `memory_search` the task keywords, `hooks_route` the description. After a success worth keeping: `memory_store` what worked. Background workers (`hooks_worker-dispatch --trigger <x>`): `audit` after security changes, `testgaps` after new features, `map` after 5+ file changes, `document` after API changes.
