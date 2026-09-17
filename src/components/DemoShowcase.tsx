import type { Copy, Locale } from "../content/copy";
import "./demo-showcase.css";

/** Static reference poster; intentionally has no media controls or video request. */
export function DemoShowcase({ copy, locale }: { copy: Copy; locale: Locale }) {
  return (
    <section className="demo-showcase container" aria-labelledby="demo-title">
      <h2 id="demo-title">{copy.harnessDemoTitle}</h2>
      <img
        className="demo-showcase__image"
        src="/images/demo-poster.jpg"
        alt={
          locale === "zh"
            ? "DeepSeek Harness 自定义用户界面演示截图"
            : "DeepSeek Harness custom user interface demo screenshot"
        }
        width="1920"
        height="1080"
        loading="lazy"
        decoding="async"
      />
    </section>
  );
}
