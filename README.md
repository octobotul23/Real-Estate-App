# One United Properties — Bucharest

> Private pitch build: pages are `noindex`. Don't deploy publicly until One United signs off.

Cinematic, scroll-driven real-estate site and design system (Next.js + Tailwind v4, GSAP + Lenis, Three.js).

```bash
npm install
npm run dev   # http://localhost:3000
```

## Structure

- `src/styles/tokens.css` — design tokens (color, fluid type, space, motion). Values marked PROVISIONAL are placeholders.
- `src/components/providers/SmoothScroll.tsx` — Lenis inertial scroll synced to GSAP ScrollTrigger.
- `src/components/motion/Reveal.tsx` — scroll-in reveal for blocks or staggered children.
- `src/components/globe/` — dotted-earth globe (land from `world-atlas`) that turns to Bucharest and zooms on scroll; `GlobeHero` pins it to the hero.
- `src/app/[locale]/` — `/en` and `/ro` routes (home, `projects/[slug]`); strings in `src/i18n/dictionaries/`.
- `src/components/projects/` — map side panel, project list, project image (placeholder until photos are supplied).

## Data

- `src/data/projects.research.json` — researched project facts (EN/RO), with sources, confidence and conflicting figures.
- `src/data/coordinate-overrides.json` — coordinates snapped onto the project's street where it exists in the road data.
- `src/data/project-images.json` (optional) — `{ "<slug>": ["/images/...jpg", ...] }`.
- Rebuild the site list after editing any of these: `python3 -I scripts/build-projects.py` → `src/data/projects.json`.
- `public/data/bucharest-streets.json` — Bucharest main roads, © OpenStreetMap contributors (ODbL), built with `scripts/build-streets.py`.

Coordinates are estimates (most are within a few hundred metres); confirm them before showing the client.
