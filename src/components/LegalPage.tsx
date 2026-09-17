import { createElement, type ReactNode } from "react";
import data from "../content/legal.json";
import { messages, sitePath, type Locale } from "../content/copy";
type RichNode =
  string | { tag: string; props: Record<string, string>; children: RichNode[] };
function renderNode(node: RichNode, index: number): ReactNode {
  return typeof node === "string"
    ? node
    : createElement(
        node.tag,
        { ...node.props, key: index },
        node.children.map(renderNode),
      );
}
export function LegalPage({
  locale,
  page,
}: {
  locale: Locale;
  page: "privacy" | "data-processing";
}) {
  const copy =
    messages[locale][
      page === "privacy" ? "SafeUsePolicy" : "DataProcessingStatement"
    ];
  const nodes = data[`${locale}/${page}`] as RichNode[];
  return (
    <main className="legal-page">
      <div className="container legal-header">
        <h1>{copy.title}</h1>
      </div>
      <div className="container legal-body">
        <article className="legal-document">{nodes.map(renderNode)}</article>
        <a className="legal-back" href={sitePath(locale)}>
          {copy.backHome}
        </a>
      </div>
    </main>
  );
}
