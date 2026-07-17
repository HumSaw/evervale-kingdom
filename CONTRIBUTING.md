# Contributing to Evervale Kingdom

Thank you for your interest in contributing! This document explains how to get set up and what we expect from contributions.

## Getting Started

1. Fork the repository and clone your fork
2. Install dependencies: `pnpm install`
3. Start the dev server: `pnpm dev`
4. Create a branch: `git checkout -b feat/my-feature`

## Development Guidelines

### Project layout

- **`lib/types.ts`** is the single source of truth for game types — update it first when changing data shapes
- **`lib/data/`** holds static game content (buildings, units, resources) — balance changes go here
- **`lib/systems/`** contains pure, framework-free game logic — keep it free of React/Next.js imports
- **`lib/store.ts`** is the only place that mutates game state — add new actions here
- **`components/game/`** holds the game UI — keep components focused and small

### Rules of thumb

- Keep game logic **deterministic**: any randomness must go through a seeded PRNG (see `mulberry32` in `lib/systems/battle.ts`)
- Bump `SCHEMA_VERSION` in `lib/store.ts` if you change the persisted `GameState` shape, and add a migration
- Run `pnpm typecheck` and `pnpm build` before opening a PR
- Follow the existing code style (TypeScript strict, no `any`)

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org):

```
feat: add research tree to the academy
fix: correct storage cap calculation for warehouse level 3
docs: update battle system documentation
refactor: extract queue logic into a shared helper
```

## Pull Requests

- Keep PRs focused — one feature or fix per PR
- Describe **what** changed and **why**
- Include screenshots or clips for UI changes
- Make sure `pnpm build` passes

## Reporting Bugs

Open an issue using the bug report template. Include:

- Steps to reproduce
- Expected vs. actual behavior
- Browser and OS
- Your save state if relevant (exportable from localStorage key `evervale-save`)

## Balance Suggestions

Game balance discussions are welcome! Open an issue with the `balance` label and include the math behind your proposal (unit power, cost curves, production rates).
