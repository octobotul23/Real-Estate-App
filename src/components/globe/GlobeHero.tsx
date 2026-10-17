"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Project } from "@/data/types";
import { ProjectPanel } from "@/components/projects/ProjectPanel";
import type { GlobeProgress } from "./GlobeScene";

gsap.registerPlugin(ScrollTrigger);

const GlobeScene = dynamic(() => import("./GlobeScene"), { ssr: false });

type GlobeHeroProps = {
  locale: Locale;
  t: Pick<Dictionary, "hero" | "map" | "project">;
  projects: Project[];
};

/** Pinned hero: orbit → Bucharest → street level, ending on a map of clickable projects. */
export function GlobeHero({ locale, t, projects }: GlobeHeroProps) {
  const section = useRef<HTMLElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const outro = useRef<HTMLDivElement>(null);
  const progress = useRef(0) as GlobeProgress;
  const [active, setActive] = useState<string | null>(null);
  const pins = useMemo(() => projects.map(({ slug, name, lat, lon }) => ({ slug, name, lat, lon })), [projects]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(intro.current!.children, {
        yPercent: 60,
        opacity: 0,
        duration: 1.6,
        stagger: 0.12,
        ease: "expo.out",
        delay: 0.2,
      });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: "+=400%",
            scrub: 1,
            pin: true,
            onUpdate: (st) => (progress.current = st.progress),
          },
        })
        .to(intro.current, { opacity: 0, yPercent: -20, duration: 0.15 }, 0)
        .fromTo(outro.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.1 }, 0.3)
        .to(outro.current, { opacity: 0, y: -40, duration: 0.1 }, 0.55)
        // Keep the timeline exactly 1 long so its positions read as scroll progress.
        .to({}, { duration: 0.45 }, 0.55);
    }, section);

    return () => ctx.revert();
  }, [progress]);

  const selected = projects.find((p) => p.slug === active) ?? null;

  return (
    <section ref={section} className="relative h-svh overflow-hidden bg-ink">
      <div className="absolute inset-0">
        <GlobeScene
          progress={progress}
          pins={pins}
          activeSlug={active}
          onSelect={setActive}
        />
      </div>

      <div
        ref={intro}
        className="pointer-events-none absolute inset-x-0 bottom-[12vh] px-[var(--gutter)] text-center"
      >
        <p className="text-xs uppercase tracking-[var(--tracking-caps)] text-stone">{t.hero.eyebrow}</p>
        <h1 className="font-display mt-4 text-display leading-[var(--leading-tight)] tracking-[var(--tracking-display)]">
          {t.hero.title}
        </h1>
      </div>

      <div ref={outro} className="pointer-events-none absolute left-[var(--gutter)] top-1/2 -translate-y-1/2 opacity-0">
        <p className="text-xs uppercase tracking-[var(--tracking-caps)] text-accent">{t.hero.coordinates}</p>
        <h2 className="font-display mt-3 max-w-[14ch] text-3xl leading-[var(--leading-tight)] tracking-[var(--tracking-display)]">
          {t.hero.destination}
        </h2>
      </div>

      <ProjectPanel locale={locale} t={t} project={selected} onClose={() => setActive(null)} />
    </section>
  );
}
