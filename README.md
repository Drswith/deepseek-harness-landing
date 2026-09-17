# DeepSeek Harness landing 还原实验

以 <https://www.deepseek.com/harness/> 为视觉参考的独立、非官方实验。当前为第二阶段：React + TypeScript + Vite 源码重建；第一阶段静态镜像仍保留用于对照。未合入 `deepseek-harness` 主项目。

Logo、字体、文案、产品截图、视频与部分着色器来自参考站，不代表已取得重新分发或品牌授权。页面的“开源 · MIT”是参考文案，不是对全部素材的许可声明；详见 [第三方内容说明](THIRD_PARTY_NOTICES.md)。

## 运行

使用支持当前 Vite 的 Node.js（22.12+ 或 24+）和 npm。

```sh
npm ci
npm run dev
```

React 开发预览：<http://127.0.0.1:43880/>。站点 base 为 `/`；中英文首页、安全使用政策和数据处理说明均可独立访问。

```sh
npm run build:netlify
npm run preview
```

生产预览：<http://127.0.0.1:43882/>。构建输出到 `dist/`，6 个路由均预渲染为 HTML；无需服务器端 React 运行时，也不依赖旧 Next.js bundle。静态服务器支持 Range、目录首页、真实 404，仅监听本机。按 `Ctrl+C` 停止。

第一阶段镜像无需依赖安装，执行 `npm run baseline` 后访问 <http://127.0.0.1:43879/harness/>。两个阶段使用不同端口和目录。

网络受限时可以使用本机代理安装依赖：

```sh
HTTPS_PROXY=http://127.0.0.1:7897 HTTP_PROXY=http://127.0.0.1:7897 npm ci
```

## 源码与基准

- `src/components/`：导航、安装命令、功能展示、静态演示图、CTA 和政策页。
- `src/components/hero/`：独立流体 shader、网格及 Three.js 鲸鱼点阵；延迟加载、离屏暂停、卸载清理和减少动态效果支持。
- `src/content/`：中英文文案及语义化政策内容，来源于已保存的参考 HTML。
- `src/styles/`：自托管字体、参考设计变量与响应式布局。
- `public/`：运行时需要的字体、图标和截图，不含视频或 Next.js 构建产物。
- `src/entry-server.tsx`、`tools/prerender.mjs`：构建时预渲染；`src/main.tsx` 负责浏览器 hydration。
- `site/harness/`、`RECON/`：第一阶段镜像与取证记录，保持原样。
- `CLONE_REPORT.md`、`CLONE_AUDIT.md`、`TEARDOWN.md`：第一阶段历史结论，不是第二阶段的验收报告。

`tools/extract-content.mjs` 和 `tools/extract-reference-assets.mjs` 从本地基准提取 JSON、SVG 和字体定义，不访问网络，不执行参考页脚本。手动运行会覆盖对应生成文件；提取后可运行 Prettier。日常开发和构建不依赖采集脚本。

## 检查

```sh
npm run typecheck
npm test
npm run build:netlify
npm run test:http
npm run check:baseline
```

HTTP 测试在临时端口启动生产静态服务器，检查 6 个预渲染路由、实际资源、Range、根路径无跳转及 404/405，并确认不再提供视频。浏览器对照使用 `ego-browser`，分别打开官方页、43880 开发版或 43882 生产版；至少检查 1440px、768px、390px，语言切换、命令复制、移动菜单、功能切换、静态演示图和页脚链接。

首屏点阵和流体为重新组织的源码实现，动画时钟、随机点分布和帧率策略与原站不保证逐帧一致。按实验要求，演示视频已替换为原封面静态图片，不包含播放器、播放按钮或 MP4 请求。应通过视觉和行为对照评估，不能用旧镜像的像素统计宣称源码版本完全一致。

第一阶段 `npm run audit` 和 `npm run diff:screenshots` 仍针对原镜像和既有 RECON 截图。`tools/capture.mjs` 会覆盖 `site/`，仅重新采集基准时使用；正常开发不要运行。

## Netlify

`netlify.toml` 已改为执行 `npm run build:netlify` 并发布 `dist/`，根路径直接提供首页，不再跳转到 `/harness/`。6 个路由为 `/`、`/en/`、`/privacy/`、`/data-processing/` 及对应的 `/en/` 政策页；均使用目录首页，无全站 SPA fallback。哈希构建资源配置长期缓存，不需要 Netlify Functions。

本轮源码改造不等于已提交、推送或部署。公开发布前须核实第三方素材许可和品牌用途。
