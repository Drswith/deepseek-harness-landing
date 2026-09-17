import { lazy, Suspense, useEffect, useState } from "react";
import { commands, type Copy, type Locale } from "../content/copy";
import { CopyButton } from "./CopyButton";
import { Links } from "./Links";

const HeroVisual = lazy(() =>
  import("./hero/HeroVisual").then((module) => ({
    default: module.HeroVisual,
  })),
);
export function Visual({
  variant = "hero",
}: {
  variant?: "hero" | "community";
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? (
    <Suspense fallback={null}>
      <HeroVisual variant={variant} />
    </Suspense>
  ) : null;
}

export function Hero({ copy, locale }: { copy: Copy; locale: Locale }) {
  const [tab, setTab] = useState<"quick" | "source">("quick");
  return (
    <section className="hero" aria-labelledby="hero-title">
      <Visual />
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="hero-title-group">
            <p className="hero-subtitle">{copy.harnessHeroSubtitle}</p>
            <h1 id="hero-title">
              {copy.harnessHeroTitlePre}
              {copy.harnessHeroTitlePost}
            </h1>
          </div>
          <div className="hero-description">
            <p>{copy.harnessHeroDesc}</p>
            <p>{copy.harnessHeroDesc2}</p>
          </div>
          <Links copy={copy} locale={locale} className="hero-desktop-links" />
        </div>
        <div className="terminal">
          <div
            className="terminal-tabs"
            role="tablist"
            aria-label={locale === "zh" ? "安装方式" : "Installation method"}
          >
            {(["quick", "source"] as const).map((key) => (
              <button
                key={key}
                id={`install-tab-${key}`}
                role="tab"
                aria-selected={tab === key}
                aria-controls="install-command"
                tabIndex={tab === key ? 0 : -1}
                className={tab === key ? "active" : ""}
                onClick={() => setTab(key)}
                onKeyDown={(event) => {
                  if (
                    ["ArrowRight", "ArrowLeft", "Home", "End"].includes(
                      event.key,
                    )
                  ) {
                    event.preventDefault();
                    const next =
                      event.key === "Home"
                        ? "quick"
                        : event.key === "End"
                          ? "source"
                          : tab === "quick"
                            ? "source"
                            : "quick";
                    setTab(next);
                    document.getElementById(`install-tab-${next}`)?.focus();
                  }
                }}
              >
                {key === "quick"
                  ? copy.harnessHeroWebTab
                  : copy.harnessHeroStartTab}
              </button>
            ))}
          </div>
          <div className="terminal-window">
            <div className="terminal-bar">
              <div className="traffic-lights" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <CopyButton value={commands[tab]} copy={copy} />
            </div>
            <div
              className="terminal-command"
              id="install-command"
              role="tabpanel"
              aria-labelledby={`install-tab-${tab}`}
            >
              <pre>
                <span aria-hidden="true">$ </span>
                {commands[tab]}
              </pre>
              <pre className="command-size-reference" aria-hidden="true">
                <span>$ </span>
                {commands.source}
              </pre>
            </div>
          </div>
        </div>
        <Links copy={copy} locale={locale} className="hero-mobile-links" />
      </div>
    </section>
  );
}
