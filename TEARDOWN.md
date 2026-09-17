# DeepSeek Harness 官网 teardown

`SOURCE`：`RECON/source/page-f752721b763e9f77.js:1` 的 `function u` 明确创建 WebGL2，编译 `#version 300 es` shader，使用 `u_prev/u_flowmap`、双 framebuffer 与 `drawArrays`；`requestAnimationFrame` 以 `1e3/30` 节流，`IntersectionObserver` 在不可见时停算，`mousemove` 更新 flowmap。因此英雄流体是实际运行时代码，不是 CSS 视觉推测。`function h` 使用 2D canvas：90px 网格、140px 鼠标作用半径，同样 30fps，并在触摸指针条件下退出。三断点均采到 `canvasCount:5`（`RECON/original-1440.json:274` 等）。

`SOURCE`：同文件 `function M` 默认 `fish`，R3F 入口以 `Promise.all([n.e(680),n.e(397),n.e(776)])` 加载，并向组件传入 `/images/hero-whale.svg`；同文件 `function z` 实现桌面滚动特性切换、移动端纵向卡片，`function H` 的视频组件懒加载且 `ssr:false`。`RECON/source/6f322bb0cffe2c36.css:3` 还实际声明 `ds-hero-enter`、`arrow-sweep`、`blink`、`rotating-border`，以及 Host Grotesk、DM Sans、Fragment Mono、Montserrat 字体；无页面级 `prefers-reduced-motion` 命中。

`SOURCE`：`page-f752721b763e9f77.js:1` 的 `function F` 用 `navigator.clipboard` 复制命令并以 `window.setTimeout(...,1600)` 恢复提示；`function $` 处理 QR 的 hover/click。`RECON/source/75-dacc4432252416b7.js:1` 的 `function m` 写入 `NEXT_LOCALE` 并调用 `router.replace({locale:r})`，`function j` 根据滚动和窗口宽度切换导航。上述行为不能只用截图替代。

`SOURCE`：`site/harness/index.html` 是下载的原始 HTML；`RECON/rendered.html` 是 hydration 后的 DOM 采样。页面包含 `self.__next_f`、`buildId`、`assetPrefix:"/harness"` 与 hydration 数据；`RECON/source/webpack-34421cb9f143e967.js:1` 将动态入口解析到 `/harness/_next/`。主页 production chunk 全部单行压缩，不能当可维护原始源码；重构应拆出 `HeroFluidCanvas`、`DotGridCanvas`、`HeroR3F`、`FeatureScroller`、`DemoVideo`、`LocalePolicy`，分别保留 shader、30fps、DPR、可见性暂停和移动端禁用规则。

`SOURCE`：业务外部数据请求仅见 `function ee` 的 `fetch("https://chat.deepseek.com/api/v0/ip_to_country_code")`，读取 `data.biz_data.code` 控制英文非大陆 X 链接；主实验已改用 `/harness/lab-region.json`（`RECON/localization.json:2-7`）。CSS 含位于普通规则之后的 Google Fonts `@import` 字符串，但当前 Chromium 采样未观察到相关请求；实际加载的字体已本地提供。GitHub、文档、插件、ArXiv、X 是导航链接。静态检查未见页面业务 WebSocket、Beacon 或 analytics，不等于全面安全审计；Next 同源 RSC/prefetch 不属于业务数据源。

本地必须提供同源 chunks、上述字体、`hero-whale.svg`、中英文截图、QR 与 `demo-poster.jpg`；`demo.mp4` 约 18.9MB（`RECON/asset-manifest.json:143-195`），可用 poster 替身但会失去播放器交互。资源清单还含 favicon、预加载字体和多份懒加载 chunk；离线验收应固定同源路径并保留失败降级。`PARTIAL`：未发现 `sourceMappingURL`，未猜测 map；R3F/Three.js/视频懒加载 chunk 内部未验证，未做浏览器复测。
