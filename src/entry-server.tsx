import { renderToString } from "react-dom/server";
import { App } from "./App";
import { dictionaries, getRoute, messages } from "./content/copy";

export function render(pathname: string) {
  const { locale, page } = getRoute(pathname);
  const legal =
    page === "privacy"
      ? messages[locale].SafeUsePolicy
      : page === "data-processing"
        ? messages[locale].DataProcessingStatement
        : null;
  return {
    html: renderToString(<App pathname={pathname} />),
    lang: locale === "zh" ? "zh-CN" : "en",
    title: legal
      ? `DeepSeek Harness | ${legal.metaTitle}`
      : dictionaries[locale].harnessMetaTitle,
    description: legal?.metaDesc ?? dictionaries[locale].harnessMetaDesc,
  };
}
