"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { GlobeProgress } from "./GlobeScene";

gsap.registerPlugin(ScrollTrigger);

const GlobeScene = dynamic(() => import("./GlobeScene"), { ssr: false });

type GlobeHeroProps = {
  eyebrow: string;
  title: string;
  /** Shown once the globe has settled on the destination. */
  destination: { label: string; title: string };
};

/** Pinned hero: the globe turns to the destination and zooms as the visitor scrolls. */
export function GlobeHero({ eyebrow, title, destination }: GlobeHeroProps) {
  const section = useRef<HTMLElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const outro = useRef<HTMLDivElement>(null);
  const progress = useRef(0) as GlobeProgress;

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
            end: "+=200%",
            scrub: 1,
            pin: true,
            onUpdate: (st) => (progress.current = st.progress),
          },
        })
        .to(intro.current, { opacity: 0, yPercent: -20, duration: 0.3 }, 0)
        .fromTo(outro.current, { opacity: 0, yPercent: 20 }, { opacity: 1, yPercent: 0, duration: 0.3 }, 0.7);
    }, section);

    return () => ctx.revert();
  }, [progress]);

  return (
    <section ref={section} className="relative h-svh overflow-hidden bg-ink">
      <div className="absolute inset-0">
        <GlobeScene progress={progress} />
      </div>

      <div
        ref={intro}
        className="pointer-events-none absolute inset-x-0 bottom-[12vh] px-[var(--gutter)] text-center"
      >
        <p className="text-xs uppercase tracking-[var(--tracking-caps)] text-stone">{eyebrow}</p>
        <h1 className="font-display mt-4 text-display leading-[var(--leading-tight)] tracking-[var(--tracking-display)]">
          {title}
        </h1>
      </div>

      <div ref={outro} className="pointer-events-none absolute left-[var(--gutter)] top-1/2 -translate-y-1/2 opacity-0">
        <p className="text-xs uppercase tracking-[var(--tracking-caps)] text-accent">{destination.label}</p>
        <h2 className="font-display mt-3 max-w-[12ch] text-3xl leading-[var(--leading-tight)] tracking-[var(--tracking-display)]">
          {destination.title}
        </h2>
      </div>
    </section>
  );
}
