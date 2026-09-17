import { useEffect, useRef, useState } from "react";
import type { Copy } from "../content/copy";

export function CopyButton({
  value,
  copy,
  icon = true,
}: {
  value: string;
  copy: Copy;
  icon?: boolean;
}) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copyCommand() {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("error");
    }
    timer.current = setTimeout(() => setState("idle"), 1600);
  }
  return (
    <button
      className="copy-button"
      type="button"
      onClick={copyCommand}
      aria-label={`${copy.harnessHeroCopy}: ${value}`}
    >
      {icon && (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {state === "copied" ? (
            <path d="m5 12 4 4L19 6" />
          ) : (
            <>
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </>
          )}
        </svg>
      )}
      <span aria-live="polite">
        {state === "copied"
          ? copy.harnessHeroCopied
          : state === "error"
            ? copy.harnessHeroCopy === "复制"
              ? "复制失败"
              : "Copy failed"
            : copy.harnessHeroCopy}
      </span>
    </button>
  );
}
