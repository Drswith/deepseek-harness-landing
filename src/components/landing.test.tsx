import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { CopyButton } from "./CopyButton";
import { dictionaries, getRoute, sitePath } from "../content/copy";
import { Hero } from "./Hero";
import { Header } from "./Header";
import { DemoShowcase } from "./DemoShowcase";

vi.mock("./hero/HeroVisual", () => ({ HeroVisual: () => null }));
afterEach(cleanup);
describe("landing routes and content", () => {
  it("prerenders the Harness badge's highlight frame and monospace label", () => {
    const html = renderToStaticMarkup(
      <Header copy={dictionaries.zh} locale="zh" page="" />,
    );
    const container = document.createElement("div");
    container.innerHTML = html;

    expect(
      container.querySelector(
        ".site-header .harness-badge > .harness-badge__label",
      )?.textContent,
    ).toBe("Harness");
    expect(container.querySelector(".brand")?.getAttribute("aria-label")).toBe(
      "DeepSeek Harness",
    );
  });

  it("uses a static demo image without video or playback controls", () => {
    const { container } = render(
      <DemoShowcase copy={dictionaries.zh} locale="zh" />,
    );
    expect(screen.getByRole("img").getAttribute("src")).toBe(
      "/images/demo-poster.jpg",
    );
    expect(container.querySelector("video,button")).toBeNull();
  });
  it("keeps the locale when navigating policy routes", () => {
    expect(getRoute("/en/privacy/")).toEqual({
      locale: "en",
      page: "privacy",
    });
    expect(sitePath("zh", "data-processing")).toBe("/data-processing/");
    expect(sitePath("en")).toBe("/en/");
    expect(sitePath("zh")).toBe("/");
    expect(Object.keys(dictionaries.en).sort()).toEqual(
      Object.keys(dictionaries.zh).sort(),
    );
  });
  it("switches installation commands without losing keyboard tab state", () => {
    render(<Hero copy={dictionaries.zh} locale="zh" />);
    const source = screen.getByRole("tab", { name: "源码安装" });
    fireEvent.click(source);
    expect(source.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").textContent).toContain("git clone");
    fireEvent.keyDown(source, { key: "ArrowLeft" });
    expect(
      screen
        .getByRole("tab", { name: "一键使用" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    fireEvent.keyDown(source, { key: "Home" });
    expect(document.activeElement?.id).toBe("install-tab-quick");
    fireEvent.keyDown(source, { key: "Home" });
    expect(document.activeElement?.id).toBe("install-tab-quick");
    fireEvent.keyDown(source, { key: "End" });
    expect(document.activeElement?.id).toBe("install-tab-source");
  });
  it("reports clipboard success and failure without a fake success state", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(<CopyButton value="command" copy={dictionaries.zh} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByText("已复制")).toBeTruthy());
    expect(writeText).toHaveBeenCalledWith("command");
    writeText.mockRejectedValueOnce(new Error("denied"));
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByText("复制失败")).toBeTruthy());
  });
  it("opens and closes the mobile menu with Escape and restores scroll", () => {
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
    };
    render(<Header copy={dictionaries.zh} locale="zh" page="" />);
    fireEvent.click(screen.getByRole("button", { name: "打开导航菜单" }));
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent(
      screen.getByRole("dialog"),
      new Event("cancel", { bubbles: true, cancelable: true }),
    );
    expect(document.body.style.overflow).toBe("");
    expect(
      screen
        .getByRole("button", { name: "打开导航菜单" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
  });
  it("links policy language switches to root-based routes", () => {
    const { container } = render(
      <Header copy={dictionaries.en} locale="en" page="privacy" light />,
    );
    const anchors = [
      ...container.querySelectorAll(".desktop-navigation .locale-toggle a"),
    ];
    expect(anchors.map((anchor) => anchor.getAttribute("href"))).toEqual([
      "/privacy/",
      "/en/privacy/",
    ]);
    expect(container.querySelector(".brand")?.getAttribute("href")).toBe(
      "/en/",
    );
  });
});
