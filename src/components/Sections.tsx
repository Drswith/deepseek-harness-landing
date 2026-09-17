import type { Copy, Locale } from "../content/copy";
import { commands, sitePath } from "../content/copy";
import { CopyButton } from "./CopyButton";
import { Icon, Links } from "./Links";
import { Visual } from "./Hero";

export function WhyHarness({ copy }: { copy: Copy }) {
  const pillars = [
    [copy.harnessPillar1Title, copy.harnessPillar1En, copy.harnessPillar1Desc],
    [copy.harnessPillar2Title, copy.harnessPillar2En, copy.harnessPillar2Desc],
    [copy.harnessPillar3Title, copy.harnessPillar3En, copy.harnessPillar3Desc],
  ];
  return (
    <section className="container why-section">
      <div className="why-heading">
        <span className="eyebrow">{copy.harnessWhyFormula}</span>
        <h2>
          {copy.harnessWhyTitlePrefix}
          <span className="harness-word">Harness</span>{" "}
          {copy.harnessWhyTitleSuffix}
        </h2>
        <div className="why-description">
          <p>{copy.harnessWhyP1}</p>
          <p>{copy.harnessWhyP2}</p>
        </div>
      </div>
      <div className="pillars">
        {pillars.map(([title, subtitle, desc], index) => (
          <article key={title} className="pillar">
            <Icon name={`pillar-${index + 1}`} />
            <h3>
              {index === 0 ? (
                <a
                  href="https://github.com/cordiverse/cordis"
                  target="_blank"
                  rel="noreferrer"
                >
                  {title}
                </a>
              ) : (
                title
              )}
            </h3>
            <p className="pillar-subtitle">{subtitle}</p>
            <p>{desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function QuickStart({ copy }: { copy: Copy }) {
  return (
    <section className="container quick-start">
      <span className="eyebrow">{copy.harnessUseEyebrow}</span>
      <h2>{copy.harnessUseTitle}</h2>
      <div className="quick-start-grid">
        {(["quick", "source"] as const).map((key, index) => (
          <article className="quick-start-card" key={key}>
            <h3>
              {index === 0 ? copy.harnessUse1Label : copy.harnessUse2Label}
            </h3>
            <p>{index === 0 ? copy.harnessUse1Desc : copy.harnessUse2Desc}</p>
            <div className="quick-command">
              <pre>
                <span aria-hidden="true">$ </span>
                {commands[key]}
              </pre>
              <CopyButton value={commands[key]} copy={copy} icon={false} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Community({ copy, locale }: { copy: Copy; locale: Locale }) {
  return (
    <div className="community-wrap">
      <Visual variant="community" />
      <section className="container community">
        <h2>{copy.harnessCtaTitle}</h2>
        <p>{copy.harnessCtaDesc}</p>
        <Links copy={copy} locale={locale} paper={false} />
      </section>
    </div>
  );
}

export function Footer({ copy, locale }: { copy: Copy; locale: Locale }) {
  return (
    <footer className="container footer">
      <div className="footer-inner">
        <details className="wechat">
          <summary>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M9.5 3C4.25 3 1 6.1 1 9.6c0 2 1.1 3.8 3.2 5.1L3.4 17l3-1.4c.6.2 1.3.3 2 .4A6.7 6.7 0 0 1 8 13.8c0-4 3.8-7.3 8.5-7.3h.3C15.4 4.3 12.8 3 9.5 3Zm-3 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm4 1C12.4 8 9 10.6 9 13.8s3.4 5.8 7.5 5.8c.7 0 1.5-.1 2.1-.2L21 21l-.6-2.5c1.7-1.1 2.6-2.7 2.6-4.7C23 10.6 20.2 8 16.5 8Zm-2.8 3a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6Zm5.1 0a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6Z" />
            </svg>
            {copy.wechatLabel}
          </summary>
          <div className="qr-popover">
            <img
              src="/images/qr-wechat.png"
              alt={copy.wechatTooltip}
              width="160"
              height="160"
              loading="lazy"
            />
            <p>{copy.wechatTooltip}</p>
          </div>
        </details>
        <p>
          {copy.harnessFooterLicense} · {copy.harnessFooterCopyright}
        </p>
        <nav aria-label={copy.harnessFooterPolicyLinks}>
          <a href={sitePath(locale, "privacy")}>{copy.harnessFooterSafeUse}</a>
          <span aria-hidden="true">·</span>
          <a href={sitePath(locale, "data-processing")}>
            {copy.harnessFooterDataProcessing}
          </a>
        </nav>
      </div>
    </footer>
  );
}
