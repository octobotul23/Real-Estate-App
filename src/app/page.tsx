import { GlobeHero } from "@/components/globe/GlobeHero";
import { Reveal } from "@/components/motion/Reveal";

// PROVISIONAL copy: placeholder until the page structure is mapped from the reference.
export default function Home() {
  return (
    <main>
      <GlobeHero
        eyebrow="One United Properties"
        title="Bucharest"
        destination={{ label: "44.43° N · 26.10° E", title: "A capital in the making" }}
      />

      <section className="mx-auto max-w-[var(--max-width)] px-[var(--gutter)] py-[var(--space-section)]">
        <Reveal stagger={0.1} className="max-w-3xl">
          <p className="text-xs uppercase tracking-[var(--tracking-caps)] text-stone">Foundation</p>
          <h2 className="font-display mt-4 text-2xl leading-[var(--leading-snug)] tracking-[var(--tracking-display)]">
            Tokens, smooth scroll, reveals and the globe are in place. Sections follow once the reference is mapped.
          </h2>
        </Reveal>
      </section>
    </main>
  );
}
