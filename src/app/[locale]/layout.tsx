import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Inter, Inter_Tight } from "next/font/google";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import "../globals.css";

// PROVISIONAL: swap for the reference site's typefaces (or licensed equivalents) once analysed.
const body = Inter({ variable: "--font-body", subsets: ["latin", "latin-ext"] });
const heading = Inter_Tight({ variable: "--font-heading", subsets: ["latin", "latin-ext"] });

type Params = Promise<{ locale: string }>;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getDictionary(locale);
  return {
    title: t.meta.title,
    description: t.meta.description,
    // Private pitch build: keep it out of search engines until the client signs off.
    robots: { index: false, follow: false },
    alternates: { languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])) },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Params }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale}>
      <body className={`${body.variable} ${heading.variable} antialiased`}>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
