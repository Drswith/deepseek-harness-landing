import { links, type Copy, type Locale } from "../content/copy";

export function Icon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <img
      className={`icon ${className}`}
      src={`/icons/${name}.svg`}
      alt=""
      aria-hidden="true"
      width="16"
      height="16"
    />
  );
}

export function Links({
  copy,
  locale,
  paper = true,
  className = "",
}: {
  copy: Copy;
  locale: Locale;
  paper?: boolean;
  className?: string;
}) {
  const urls = links(locale);
  const items = [
    ["github", copy.harnessHeroGithub],
    ["docs", copy.harnessCtaDocs],
    ["plugins", copy.harnessCtaPlugins],
    ...(paper ? [["paper", copy.harnessCtaPaper]] : []),
  ] as const;
  return (
    <div className={`action-links ${className}`}>
      {items.map(([key, label]) => (
        <a
          key={key}
          className={`button ${key === "github" ? "button-primary" : "button-secondary"}`}
          href={urls[key as keyof typeof urls]}
          target="_blank"
          rel="noreferrer"
        >
          <Icon name={key} />
          {label}
        </a>
      ))}
    </div>
  );
}
