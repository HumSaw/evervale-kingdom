<div align="center">

<img src=".github/assets/banner.png" alt="Evervale Kingdom — fairy-tale strategy game banner" width="100%" />

# Evervale Kingdom

**A fairy-tale kingdom-building strategy game that runs entirely in your browser.**

Build your castle, grow your economy, raise an army, and defeat an endless procession of procedurally generated enemy kingdoms.

[English](README.md) · [Русский](README.ru.md)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![CI](https://github.com/HumSaw/evervale-kingdom/actions/workflows/ci.yml/badge.svg)](https://github.com/HumSaw/evervale-kingdom/actions/workflows/ci.yml)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/State-Zustand-593D88)](https://zustand.docs.pmnd.rs)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

---

## Screenshots

| Castle & Economy | Battle |
| :---: | :---: |
| ![Castle view with buildings and queues](.github/assets/screenshot-castle.png) | ![Battle view with a procedurally generated enemy kingdom](.github/assets/screenshot-battle.png) |

## Features

- **17 buildings** across 4 categories — core, economy, military, and defense — each with multiple upgrade levels, costs, build times, and unlocks gated by your Keep level
- **12 unit types** — infantry, ranged, cavalry, siege, magic, and elite units, each with HP, attack, armor, speed, range, and unique abilities
- **Deterministic battle simulation** — round-based combat seeded by army composition and enemy index, so results can't be re-rolled by replaying the animation
- **Procedural enemy generator** — an endless series of enemy kingdoms with unique names, rulers, heraldic crests, traits (aggressive, fortified, wealthy, swift, arcane, horde), castle styles, and flavor text
- **6 resources** — gold, wood, stone, iron, food, and crystals with per-minute production and storage caps
- **Build & training queues** with cancel/refund, plus **offline progress** — the economy keeps ticking while you're away
- **Heraldry system** — customizable crests (shape, symbol, colors) for your kingdom and every enemy
- **Promo codes** — stored as hashes only, never in plain text (try `WELCOME2026` for a head start)
- **Chronicles** — battle history and lifetime stats
- **Persistent saves** via `zustand/persist` with schema versioning

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [pnpm](https://pnpm.io) 9+

### Installation

```bash
git clone https://github.com/HumSaw/evervale-kingdom.git
cd evervale-kingdom
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and start building your kingdom.

### Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Serve the production build |
| `pnpm typecheck` | Run the TypeScript compiler checks |

## Architecture

The game is fully client-side with a clean separation between data, systems, state, and UI:

```
evervale-kingdom/
├── app/                    # Next.js App Router (layout, page, global styles)
├── components/
│   ├── game/               # Game UI: shell, panels, cards, resource bar, crest badge
│   └── ui/                 # Base UI primitives (shadcn)
└── lib/
    ├── types.ts            # Single source of truth for all game types
    ├── store.ts            # Zustand store: state, actions, persistence, game tick
    ├── data/               # Static definitions: buildings, units, resources
    ├── systems/            # Pure game logic:
    │   ├── economy.ts      #   production, storage caps, affordability
    │   ├── battle.ts       #   deterministic round-based battle simulation
    │   ├── enemy-generator.ts  # seeded procedural enemy kingdoms
    │   └── promo.ts        #   hash-based promo code registry
    ├── format.ts           # Number/duration formatting helpers
    └── icon-map.ts         # Lucide icon mappings
```

**Design principles:**

- `lib/systems/` contains pure, framework-free functions — easy to test and reason about
- All randomness is seeded (mulberry32 PRNG), making enemies and battles reproducible
- Battle outcomes are computed instantly and authoritatively; the UI animation merely replays the result
- Game state is versioned (`schemaVersion`) to support safe save migrations

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router) + [React 19](https://react.dev) |
| Language | [TypeScript 5.7](https://www.typescriptlang.org) (strict) |
| State | [Zustand 5](https://zustand.docs.pmnd.rs) with `persist` middleware |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| Animation | [Motion](https://motion.dev) |
| Icons | [Lucide](https://lucide.dev) |

## Roadmap

- [ ] Research tree (Academy) — types already scaffolded in `ResearchState`
- [ ] More unit abilities affecting battle simulation
- [ ] Sound effects and music
- [ ] Localization (the game UI is currently in Russian)
- [ ] Server-side promo validation for multiplayer scenarios

## Contributing

Contributions are welcome! Please read the [contributing guidelines](CONTRIBUTING.md) before opening an issue or pull request.

## License

Distributed under the [MIT License](LICENSE).

---

<div align="center">
Built with ❤️ and <a href="https://v0.app">v0</a>
</div>
