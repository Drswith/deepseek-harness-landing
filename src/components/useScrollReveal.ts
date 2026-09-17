import { useEffect, type RefObject } from "react";

/** Progressive reveal: prerendered content remains visible without JavaScript. */
export function useScrollReveal(root: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const element = root.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!element || preference.matches || !window.IntersectionObserver) return;
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          const animation = entry.target.animate(
            [
              { opacity: 0, transform: "translateY(20px)" },
              { opacity: 1, transform: "none" },
            ],
            { duration: 700, easing: "cubic-bezier(.16,1,.3,1)" },
          );
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
        }
      },
      { threshold: 0.1 },
    );
    element
      .querySelectorAll(
        ".why-heading, .pillar, .features__title, .demo-showcase h2, .demo-showcase__image, .quick-start h2, .quick-start-card, .community",
      )
      .forEach((node) => observer.observe(node));
    const stop = () => {
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    };
    const onPreferenceChange = () => {
      if (preference.matches) stop();
    };
    preference.addEventListener("change", onPreferenceChange);
    return () => {
      stop();
      preference.removeEventListener("change", onPreferenceChange);
    };
  }, [root]);
}
