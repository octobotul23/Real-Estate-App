# One United Properties — Bucharest

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
