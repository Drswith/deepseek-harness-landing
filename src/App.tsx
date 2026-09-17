import { useRef } from "react";
import { dictionaries, getRoute } from "./content/copy";
import { useScrollReveal } from "./components/useScrollReveal";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import {
  WhyHarness,
  QuickStart,
  Community,
  Footer,
} from "./components/Sections";
import { Features } from "./components/features/Features";
import { DemoShowcase } from "./components/DemoShowcase";
import { LegalPage } from "./components/LegalPage";

export function App({ pathname }: { pathname: string }) {
  const root = useRef<HTMLDivElement>(null);
  useScrollReveal(root);
  const { locale, page } = getRoute(pathname);
  const copy = dictionaries[locale];
  const legal = page === "privacy" || page === "data-processing";
  return (
    <div
      ref={root}
      lang={locale === "zh" ? "zh-CN" : "en"}
      className={legal ? "app light-theme" : "app"}
    >
      <Header copy={copy} locale={locale} page={page} light={legal} />
      {legal ? (
        <LegalPage locale={locale} page={page} />
      ) : (
        <main>
          <Hero copy={copy} locale={locale} />
          <WhyHarness copy={copy} />
          <Features copy={copy} locale={locale} />
          <DemoShowcase copy={copy} locale={locale} />
          <QuickStart copy={copy} />
          <Community copy={copy} locale={locale} />
        </main>
      )}
      <Footer copy={copy} locale={locale} />
    </div>
  );
}
