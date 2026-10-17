import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectImage } from "@/components/projects/ProjectImage";
import { getProject, projects } from "@/data/projects";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

type Params = Promise<{ locale: string; slug: string }>;

export function generateStaticParams() {
  return locales.flatMap((locale) => projects.map(({ slug }) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = getProject(slug);
  if (!isLocale(locale) || !project) return {};
  return { title: `${project.name} — One United Properties`, description: project.summary[locale] };
}

export default async function ProjectPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  const project = getProject(slug);
  if (!isLocale(locale) || !project) notFound();
  const t = await getDictionary(locale);

  const facts = [
    [t.project.neighbourhood, project.neighbourhood[locale]],
    [t.project.status, t.map.status[project.status]],
    [t.project.units, project.units?.toLocaleString(locale)],
    [t.project.delivery, project.deliveryYear],
    [t.project.buildings, project.buildings],
    [t.project.architect, project.architect],
  ].filter(([, v]) => v != null && v !== "");

  const lists = [
    [t.project.residences, project.unitTypes[locale]],
    [t.project.amenities, project.amenities[locale]],
    [t.project.sustainability, project.sustainability],
  ] as const;

  return (
    <main className="bg-paper text-ink">
      <section className="relative h-[85svh] overflow-hidden bg-ink text-paper">
        <ProjectImage project={project} index={0} sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[var(--max-width)] px-[var(--gutter)] pb-[var(--space-16)]">
          <Link
            href={`/${locale}`}
            className="text-xs uppercase tracking-[var(--tracking-caps)] text-paper/70 hover:text-paper"
          >
            ← {t.project.back}
          </Link>
          <Reveal stagger={0.1}>
            <p className="mt-8 text-xs uppercase tracking-[var(--tracking-caps)] text-accent">
              {project.neighbourhood[locale]}
            </p>
            <h1 className="font-display mt-3 text-3xl leading-[var(--leading-tight)] tracking-[var(--tracking-display)]">
              {project.name}
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto grid max-w-[var(--max-width)] gap-[var(--space-16)] px-[var(--gutter)] py-[var(--space-section)] lg:grid-cols-[2fr_1fr]">
        <Reveal>
          <p className="font-display text-xl leading-[var(--leading-snug)] tracking-[var(--tracking-display)]">
            {project.summary[locale]}
          </p>
        </Reveal>

        <Reveal as="dl" stagger={0.06} className="grid grid-cols-2 gap-x-6 gap-y-6 self-start border-t border-line pt-6">
          {facts.map(([label, value]) => (
            <div key={String(label)}>
              <dt className="text-xs uppercase tracking-[var(--tracking-caps)] text-stone">{label}</dt>
              <dd className="mt-1 text-sm">{value}</dd>
            </div>
          ))}
        </Reveal>
      </section>

      <section className="mx-auto grid max-w-[var(--max-width)] gap-[var(--space-12)] px-[var(--gutter)] pb-[var(--space-section)] md:grid-cols-3">
        {lists
          .filter(([, items]) => items.length > 0)
          .map(([label, items]) => (
            <Reveal key={label} className="border-t border-line pt-6">
              <h2 className="text-xs uppercase tracking-[var(--tracking-caps)] text-stone">{label}</h2>
              <ul className="mt-4 space-y-2 text-sm leading-[var(--leading-body)]">
                {items.map((item) => (
                  <li key={item} className="first-letter:uppercase">
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
      </section>

      {project.images.length > 1 && (
        <section className="mx-auto grid max-w-[var(--max-width)] gap-[var(--space-4)] px-[var(--gutter)] pb-[var(--space-section)] md:grid-cols-2">
          {project.images.slice(1).map((_, i) => (
            <Reveal key={i} className="relative aspect-[4/3] overflow-hidden">
              <ProjectImage project={project} index={i + 1} sizes="(min-width: 768px) 50vw, 100vw" />
            </Reveal>
          ))}
        </section>
      )}

      <section className="bg-ink text-paper">
        <div className="mx-auto flex max-w-[var(--max-width)] flex-col items-start gap-8 px-[var(--gutter)] py-[var(--space-section)] md:flex-row md:items-end md:justify-between">
          <h2 className="font-display max-w-[16ch] text-2xl leading-[var(--leading-snug)] tracking-[var(--tracking-display)]">
            {project.name}
          </h2>
          <a
            // TODO: replace with One United's enquiry form or sales address.
            href="https://www.one.ro/"
            className="inline-flex items-center gap-6 rounded-[var(--radius-pill)] bg-paper px-8 py-4 text-sm text-ink transition-colors hover:bg-paper-soft"
          >
            {t.project.enquire} <span aria-hidden>→</span>
          </a>
        </div>
      </section>
    </main>
  );
}
