import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App";
import { dictionaries, getRoute, messages } from "./content/copy";
import "./styles/tokens.css";
import "./styles/global.css";

const pathname = window.location.pathname;
const { locale, page } = getRoute(pathname);
const copy =
  page === "privacy"
    ? messages[locale].SafeUsePolicy
    : page === "data-processing"
      ? messages[locale].DataProcessingStatement
      : null;
document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
document.title = copy
  ? `DeepSeek Harness | ${copy.metaTitle}`
  : dictionaries[locale].harnessMetaTitle;
document
  .querySelector('meta[name="description"]')
  ?.setAttribute(
    "content",
    copy?.metaDesc ?? dictionaries[locale].harnessMetaDesc,
  );
const root = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App pathname={pathname} />
  </StrictMode>
);
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
