import zh from "./zh.json";
import en from "./en.json";

export type Locale = "zh" | "en";
export type Copy = { [Key in keyof typeof zh.Index]: string };
export const dictionaries: Record<Locale, Copy> = {
  zh: zh.Index,
  en: en.Index,
};
export const messages = { zh, en };

export const commands = {
  quick: "npx @deepseek-ai/dsh web",
  source: "git clone https://github.com/deepseek-ai/deepseek-harness",
};

export function sitePath(locale: Locale, page = "") {
  return `/${locale === "en" ? "en/" : ""}${page ? `${page}/` : ""}`;
}

export function getRoute(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const locale: Locale = parts[0] === "en" ? "en" : "zh";
  const page = parts[locale === "en" ? 1 : 0] ?? "";
  return { locale, page };
}

export const links = (locale: Locale) => ({
  github: "https://github.com/deepseek-ai/deepseek-harness",
  docs: `https://deepseek-harness.github.io/deepseek-harness/${locale === "en" ? "en/" : ""}guide/quickstart`,
  plugins: "https://github.com/topics/dsh-plugin",
  paper: "https://arxiv.org/abs/2608.25512",
});
