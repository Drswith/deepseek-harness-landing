import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import type { Copy, Locale } from "../../content/copy";
import "./features.css";

type FeatureId = "plugin" | "trajectory" | "modes";

type Feature = {
  id: FeatureId;
  label: string;
  description: ReactNode;
  visual: ReactNode;
};

type ModeId = "standard" | "code" | "minimal" | "cordis";

function FeatureIcon({ id }: { id: FeatureId }) {
  if (id === "plugin") {
    return (
      <svg aria-hidden="true" viewBox="0 0 28 28" fill="none">
        <path
          d="M14 3 23.5 8.5v11L14 25 4.5 19.5v-11L14 3Z"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <path
          d="m5 9 9 5.2L23 9M14 14.2v10.2"
          stroke="currentColor"
          strokeWidth="1.3"
        />
      </svg>
    );
  }

  if (id === "trajectory") {
    return (
      <svg aria-hidden="true" viewBox="0 0 28 28" fill="none">
        <circle
          cx="14"
          cy="14"
          r="9.5"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <path
          d="m12 10.5 6 3.5-6 3.5v-7Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 28 28" fill="none">
      <rect
        x="4.5"
        y="4.5"
        width="8"
        height="8"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <rect
        x="15.5"
        y="4.5"
        width="8"
        height="8"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <rect
        x="4.5"
        y="15.5"
        width="8"
        height="8"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <rect
        x="15.5"
        y="15.5"
        width="8"
        height="8"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function Chevron({ up = false }: { up?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={up ? "mode-chevron mode-chevron--up" : "mode-chevron"}
      viewBox="0 0 12 12"
      fill="none"
    >
      <path
        d="m3 4.5 3 3 3-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <path
        d="M2 4.5C2 3.7 2.7 3 3.5 3h2.7l1.5 1.8h4.8c.8 0 1.5.7 1.5 1.5v5.2c0 .8-.7 1.5-1.5 1.5h-9C2.7 13 2 12.3 2 11.5v-7Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PresetIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="3.3" r="1.3" fill="currentColor" />
      <circle cx="3.5" cy="11.4" r="1.3" fill="currentColor" />
      <circle cx="12.5" cy="11.4" r="1.3" fill="currentColor" />
      <path
        d="M8 4.8v2.1M4.6 10.2l2-1.5M11.4 10.2l-2-1.5"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" fill="none">
      <path
        d="M6 1.5v9M1.5 6h9"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SubmitIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" fill="none">
      <path
        d="M6 10V2M2.5 5.5 6 2l3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ModePreview({ copy }: { copy: Copy }) {
  const menuId = useId();
  const modeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const modeOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [selectedMode, setSelectedMode] = useState<ModeId>("cordis");
  const [highlightedMode, setHighlightedMode] = useState<ModeId>("cordis");
  const [menuOpen, setMenuOpen] = useState(true);
  const modes = [
    {
      id: "standard" as const,
      name: copy.harnessModeStandardName,
      description: copy.harnessModeStandardDesc,
    },
    {
      id: "code" as const,
      name: copy.harnessModeCodeName,
      description: copy.harnessModeCodeDesc,
    },
    {
      id: "minimal" as const,
      name: copy.harnessModeMinimalName,
      description: copy.harnessModeMinimalDesc,
    },
    {
      id: "cordis" as const,
      name: copy.harnessModeCordisName,
      description: copy.harnessModeCordisDesc,
    },
  ];
  const selected = modes.find((mode) => mode.id === selectedMode) ?? modes[3]!;
  const focusMode = (index: number) => {
    const mode = modes[index];
    if (!mode) return;
    setHighlightedMode(mode.id);
    modeOptionRefs.current[index]?.focus();
  };
  const handleModeKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setMenuOpen(false);
      modeTriggerRef.current?.focus();
      return;
    }

    let nextIndex: number | undefined;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = (index + 1) % modes.length;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex = (index - 1 + modes.length) % modes.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = modes.length - 1;
    }

    if (nextIndex !== undefined) {
      event.preventDefault();
      focusMode(nextIndex);
    }
  };

  return (
    <div className="mode-preview" aria-label={copy.harnessFeat3Alt}>
      <div className="mode-preview__canvas">
        <div className="mode-preview__topline">
          <button
            type="button"
            className="mode-chip mode-chip--project"
            aria-controls={menuId}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <FolderIcon />
            <span>dsh-demo</span>
            <Chevron up={menuOpen} />
          </button>
          <button
            type="button"
            className="mode-chip mode-chip--selected"
            ref={modeTriggerRef}
            aria-controls={menuId}
            aria-expanded={menuOpen}
            onClick={() => {
              setHighlightedMode(selectedMode);
              setMenuOpen((open) => !open);
            }}
          >
            <PresetIcon />
            <span>{selected.name}</span>
            <Chevron up={menuOpen} />
          </button>
        </div>

        {menuOpen ? (
          <div
            className="mode-menu"
            id={menuId}
            role="listbox"
            aria-label={copy.harnessFeat3Label}
            aria-activedescendant={`${menuId}-${highlightedMode}`}
          >
            {modes.map((mode, index) => (
              <button
                type="button"
                className={`mode-option${selectedMode === mode.id ? " is-selected" : ""}`}
                key={mode.id}
                id={`${menuId}-${mode.id}`}
                ref={(element) => {
                  modeOptionRefs.current[index] = element;
                }}
                role="option"
                aria-selected={selectedMode === mode.id}
                tabIndex={highlightedMode === mode.id ? 0 : -1}
                onFocus={() => setHighlightedMode(mode.id)}
                onKeyDown={(event) => handleModeKeyDown(event, index)}
                onClick={() => {
                  setSelectedMode(mode.id);
                  setHighlightedMode(mode.id);
                  setMenuOpen(false);
                  modeTriggerRef.current?.focus();
                }}
              >
                <span className="mode-option__copy">
                  <span className="mode-option__name">{mode.name}</span>
                  <span className="mode-option__description">
                    {mode.description}
                  </span>
                </span>
                {selectedMode === mode.id ? (
                  <span className="mode-option__check" aria-hidden="true">
                    ✓
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mode-composer">
          <div className="mode-composer__placeholder">
            {copy.harnessModePlaceholder}
          </div>
          <div className="mode-composer__footer">
            <span className="mode-composer__plus" aria-hidden="true">
              <PlusIcon />
            </span>
            <button
              type="button"
              className="mode-composer__submit"
              aria-label={copy.harnessFeat3Label}
              onClick={() => setMenuOpen(true)}
            >
              <SubmitIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScreenshotPreview({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="features__image-wrap">
      <img className="features__image" src={src} alt={alt} />
    </div>
  );
}

function FeatureHeading({ copy }: { copy: Copy }) {
  return (
    <div className="features__heading">
      <span className="features__eyebrow">{copy.harnessFeatEyebrow}</span>
      <h2 className="features__title">{copy.harnessFeatTitle}</h2>
    </div>
  );
}

export function Features({ copy, locale }: { copy: Copy; locale: Locale }) {
  const featureRefs = useRef<Array<HTMLDivElement | null>>([]);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [stickyTop, setStickyTop] = useState("20vh");

  const features: Feature[] = [
    {
      id: "plugin",
      label: copy.harnessFeat1Label,
      description: (
        <>
          {copy.harnessFeat1DescPrefix}
          <a
            className="features__link"
            href="https://github.com/cordiverse/cordis"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
          >
            Cordis
          </a>
          {copy.harnessFeat1DescSuffix}
        </>
      ),
      visual: (
        <ScreenshotPreview
          src={`/images/harness/feat-plugin${locale === "en" ? ".en" : ""}.png`}
          alt={copy.harnessFeat1ScreenshotAlt}
        />
      ),
    },
    {
      id: "trajectory",
      label: copy.harnessFeat2Label,
      description: copy.harnessFeat2Desc,
      visual: (
        <ScreenshotPreview
          src={`/images/harness/trajectory-real-view.${locale === "en" ? "en" : "zh"}.png`}
          alt={copy.harnessFeat2Alt}
        />
      ),
    },
    {
      id: "modes",
      label: copy.harnessFeat3Label,
      description: copy.harnessFeat3Desc,
      visual: <ModePreview copy={copy} />,
    },
  ];

  useEffect(() => {
    const updateStickyPosition = () => {
      const height = previewRef.current?.offsetHeight ?? 0;
      setStickyTop(`${Math.max(0, (window.innerHeight - height) / 2)}px`);
    };

    updateStickyPosition();
    window.addEventListener("resize", updateStickyPosition);
    return () => window.removeEventListener("resize", updateStickyPosition);
  }, []);

  useEffect(() => {
    const updateActiveFeature = () => {
      const center = window.innerHeight / 2;
      const index = featureRefs.current.findIndex((element) => {
        if (!element) return false;
        const bounds = element.getBoundingClientRect();
        return bounds.top <= center && bounds.bottom > center;
      });

      if (index >= 0)
        setActiveIndex((current) => (current === index ? current : index));
    };

    updateActiveFeature();
    window.addEventListener("scroll", updateActiveFeature, { passive: true });
    window.addEventListener("resize", updateActiveFeature);
    return () => {
      window.removeEventListener("scroll", updateActiveFeature);
      window.removeEventListener("resize", updateActiveFeature);
    };
  }, []);

  const scrollToFeature = (index: number) => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    featureRefs.current[index]?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center",
    });
  };

  return (
    <section className="features container">
      <div className="features__desktop">
        <FeatureHeading copy={copy} />
        <div className="features__desktop-grid">
          <div className="features__items">
            {features.map((feature, index) => (
              <div
                className="features__item"
                key={feature.id}
                ref={(element) => {
                  featureRefs.current[index] = element;
                }}
                role="button"
                tabIndex={0}
                aria-current={activeIndex === index ? "step" : undefined}
                style={{ opacity: activeIndex === index ? 1 : 0.3 }}
                onClick={() => scrollToFeature(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    scrollToFeature(index);
                  }
                }}
              >
                <div className="features__item-heading">
                  <span className="features__icon">
                    <FeatureIcon id={feature.id} />
                  </span>
                  <h3>{feature.label}</h3>
                </div>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
          <div className="features__visual-column">
            <div
              className="features__sticky"
              ref={previewRef}
              style={{ top: stickyTop }}
            >
              <div className="features__preview">
                {features.map((feature, index) => (
                  <div
                    className="features__preview-layer"
                    key={feature.id}
                    inert={activeIndex !== index}
                    style={{
                      opacity: activeIndex === index ? 1 : 0,
                      pointerEvents: activeIndex === index ? "auto" : "none",
                    }}
                  >
                    {feature.visual}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="features__mobile">
        <FeatureHeading copy={copy} />
        <div className="features__mobile-items">
          {features.map((feature) => (
            <article className="features__mobile-item" key={feature.id}>
              <div className="features__mobile-copy">
                <div className="features__item-heading">
                  <span className="features__icon">
                    <FeatureIcon id={feature.id} />
                  </span>
                  <h3>{feature.label}</h3>
                </div>
                <p>{feature.description}</p>
              </div>
              <div className="features__preview features__preview--mobile">
                {feature.visual}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
