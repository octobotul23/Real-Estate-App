"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type RevealProps = {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  /** Seconds between direct children. 0 animates the element as one block. */
  stagger?: number;
  delay?: number;
};

/** Fades and lifts content into view as it enters the viewport. */
export function Reveal({ children, as: Tag = "div", className, stagger = 0, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = stagger ? Array.from(el.children) : el;

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        yPercent: 30,
        opacity: 0,
        duration: 1.2,
        delay,
        stagger,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [stagger, delay]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
