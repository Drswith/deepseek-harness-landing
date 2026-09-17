import { useEffect, useRef, useState } from "react";
import { links, sitePath, type Copy, type Locale } from "../content/copy";
import { Icon } from "./Links";

export function Header({
  copy,
  locale,
  page,
  light = false,
}: {
  copy: Copy;
  locale: Locale;
  page: string;
  light?: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 30);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  useEffect(() => {
    const dialog = menu.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
      const overflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = overflow;
        dialog.close();
      };
    }
  }, [open]);
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  const localeToggle = (
    <div
      className="locale-toggle"
      aria-label={locale === "zh" ? "语言" : "Language"}
    >
      {(["zh", "en"] as const).map((lang) => (
        <a
          key={lang}
          href={sitePath(lang, page)}
          className={lang === locale ? "active" : ""}
          aria-current={lang === locale ? "true" : undefined}
        >
          {lang === "zh" ? "中文" : "EN"}
        </a>
      ))}
    </div>
  );
  const brand = (
    <a className="brand" href={sitePath(locale)} aria-label="DeepSeek Harness">
      <img
        src={light ? "/images/brand-light.svg" : "/images/brand.svg"}
        width="140"
        height="24"
        alt="deepseek"
      />
      <span className="harness-badge">Harness</span>
    </a>
  );
  return (
    <>
      <header
        className={`site-header ${scrolled ? "scrolled" : ""} ${light ? "light" : ""}`}
      >
        <div className="container header-inner">
          <div className="brand-group">
            {brand}
            <span className="preview-badge" title={copy.harnessPreviewLabel}>
              {copy.harnessPreviewBadge}
            </span>
          </div>
          <div className="desktop-navigation">
            {localeToggle}
            {scrolled ? (
              <a
                className="button button-primary button-small"
                href={links(locale).github}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="github" />
                GitHub
              </a>
            ) : null}
          </div>
          <button
            ref={trigger}
            className="menu-button"
            aria-label={
              locale === "zh" ? "打开导航菜单" : "Open navigation menu"
            }
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(true)}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </header>
      <dialog
        ref={menu}
        id="mobile-navigation"
        className="mobile-navigation"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="mobile-menu-top">
          {brand}
          <button
            className="menu-button"
            onClick={close}
            aria-label={
              locale === "zh" ? "关闭导航菜单" : "Close navigation menu"
            }
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="m5 5 14 14M19 5 5 19" />
            </svg>
          </button>
        </div>
        <nav aria-label={locale === "zh" ? "主导航" : "Main navigation"}>
          {Object.entries(links(locale)).map(([key, href]) => (
            <a key={key} href={href} target="_blank" rel="noreferrer">
              {
                {
                  github: "GitHub",
                  docs: copy.harnessCtaDocs,
                  plugins: copy.harnessCtaPlugins,
                  paper: copy.harnessCtaPaper,
                }[key as keyof ReturnType<typeof links>]
              }
            </a>
          ))}
        </nav>
        {localeToggle}
      </dialog>
    </>
  );
}
