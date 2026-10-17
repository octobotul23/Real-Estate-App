import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Project, ProjectStatus } from "@/data/types";
import { Reveal } from "@/components/motion/Reveal";

const ORDER: ProjectStatus[] = ["construction", "launching", "delivered"];

type ProjectListProps = {
  locale: Locale;
  t: Pick<Dictionary, "map" | "project">;
  projects: Project[];
};

/** Index of every project, grouped by status, one row per project. */
export function ProjectList({ locale, t, projects }: ProjectListProps) {
  return (
    <div className="space-y-[var(--space-24)]">
      {ORDER.map((status) => {
        const group = projects
          .filter((p) => p.status === status)
          .sort((a, b) => (b.deliveryYear ?? 9999) - (a.deliveryYear ?? 9999));
        if (!group.length) return null;
        return (
          <div key={status}>
            <p className="text-xs uppercase tracking-[var(--tracking-caps)] text-stone">
              {t.map.status[status]} · {group.length}
            </p>
            <Reveal as="ul" stagger={0.05} className="mt-6 border-t border-line-inverse">
              {group.map((p) => (
                <li key={p.slug} className="border-b border-line-inverse">
                  <Link
                    href={`/${locale}/projects/${p.slug}`}
                    className="group grid grid-cols-[1fr_auto] items-baseline gap-4 py-6 md:grid-cols-[2fr_2fr_1fr_auto]"
                  >
                    <span className="font-display text-xl tracking-[var(--tracking-display)] transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-expo)] group-hover:translate-x-3">
                      {p.name}
                    </span>
                    <span className="hidden text-sm text-stone md:block">{p.neighbourhood[locale]}</span>
                    <span className="hidden text-sm text-stone md:block">
                      {p.units ? `${p.units.toLocaleString(locale)} ${t.project.units.toLowerCase()}` : ""}
                    </span>
                    <span className="text-sm text-stone">{p.deliveryYear ?? "—"}</span>
                  </Link>
                </li>
              ))}
            </Reveal>
          </div>
        );
      })}
    </div>
  );
}
