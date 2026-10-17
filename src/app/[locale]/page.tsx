import { notFound } from "next/navigation";
import { GlobeHero } from "@/components/globe/GlobeHero";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectList } from "@/components/projects/ProjectList";
import { projects } from "@/data/projects";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getDictionary(locale);

  return (
    <main>
      <GlobeHero locale={locale} t={t} projects={projects} />

      <section id="projects" className="mx-auto max-w-[var(--max-width)] px-[var(--gutter)] py-[var(--space-section)]">
        <Reveal stagger={0.1} className="max-w-3xl">
          <p className="text-xs uppercase tracking-[var(--tracking-caps)] text-stone">{t.nav.projects}</p>
          <h2 className="font-display mt-4 text-2xl leading-[var(--leading-snug)] tracking-[var(--tracking-display)]">
            {t.project.listTitle}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-[var(--leading-body)] text-paper/70">{t.project.listIntro}</p>
        </Reveal>

        <div className="mt-[var(--space-24)]">
          <ProjectList locale={locale} t={t} projects={projects} />
        </div>
      </section>
    </main>
  );
}
