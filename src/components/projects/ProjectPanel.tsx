"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Project } from "@/data/types";
import { ProjectImage } from "./ProjectImage";

type ProjectPanelProps = {
  locale: Locale;
  t: Pick<Dictionary, "map" | "project">;
  project: Project | null;
  onClose: () => void;
};

/** Slide-in side panel with a project's cover, key facts and a link to its page. */
export function ProjectPanel({ locale, t, project, onClose }: ProjectPanelProps) {
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!panel.current) return;
    // GSAP reads the initial inline translateX as pixels in `x`; zero it and drive xPercent.
    gsap.to(panel.current, {
      x: 0,
      xPercent: project ? 0 : 105,
      duration: project ? 0.9 : 0.6,
      ease: project ? "expo.out" : "expo.in",
    });
  }, [project]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const facts = project
    ? [
        [t.project.neighbourhood, project.neighbourhood[locale]],
        [t.project.status, t.map.status[project.status]],
        [t.project.units, project.units?.toLocaleString(locale)],
        [t.project.delivery, project.deliveryYear],
      ].filter(([, v]) => v != null && v !== "")
    : [];

  return (
    <aside
      ref={panel}
      data-lenis-prevent
      aria-hidden={!project}
      style={{ transform: "translateX(105%)" }}
      className="absolute inset-y-0 right-0 z-30 flex w-full max-w-md flex-col overflow-y-auto bg-paper text-ink"
    >
      {project && (
        <>
          <div className="relative aspect-[4/3] shrink-0">
            <ProjectImage project={project} index={0} sizes="28rem" />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-[var(--radius-pill)] bg-paper/90 px-4 py-2 text-xs uppercase tracking-[var(--tracking-caps)]"
            >
              {t.map.close}
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-8 p-8">
            <div>
              <p className="text-xs uppercase tracking-[var(--tracking-caps)] text-stone">{t.map.status[project.status]}</p>
              <h3 className="font-display mt-2 text-xl leading-[var(--leading-snug)] tracking-[var(--tracking-display)]">
                {project.name}
              </h3>
              <p className="mt-4 text-sm leading-[var(--leading-body)] text-ink/70">{project.summary[locale]}</p>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-6">
              {facts.map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-xs uppercase tracking-[var(--tracking-caps)] text-stone">{label}</dt>
                  <dd className="mt-1 text-sm">{value}</dd>
                </div>
              ))}
            </dl>

            <Link
              href={`/${locale}/projects/${project.slug}`}
              className="mt-auto inline-flex items-center justify-between rounded-[var(--radius-pill)] bg-ink px-6 py-4 text-sm text-paper transition-colors hover:bg-ink-soft"
            >
              {t.map.viewProject}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </>
      )}
    </aside>
  );
}
