# DeepSeek Harness landing 本地复刻实验

参考站：<https://www.deepseek.com/harness/>。采集日期：2026-09-17。

本实验用于比较本地还原效果，不是 DeepSeek 官方站点，也不是找回的官网源代码。第一阶段保留原 Logo、文案、截图、视频与客户端构建产物；仓库保存不等于网站部署，也未合入 `deepseek-harness` 主项目。页面中的 MIT 文案随参考站保留，不代表本实验已确认所有官网素材的授权范围；见 [第三方内容说明](THIRD_PARTY_NOTICES.md)。

## 预览

```sh
cd deepseek-harness-landing
npm start
```

预览无需安装依赖，使用 Node.js 运行。默认仅监听 `127.0.0.1:43879`，打开 <http://127.0.0.1:43879/harness/>。`Ctrl+C` 停止；如端口已被本实验占用，直接打开地址，不必重复启动。本地工作副本已移至 `/Users/drs/workspaces/personal/deepseek-harness-landing`。

## Netlify 部署

仓库已包含根级 `netlify.toml`，Netlify 会使用 `site/` 作为发布目录，并在部署前运行 `npm run build:netlify`。根路径会跳转到现有的 `/harness/` 路由，页面目录由静态 `index.html` 提供；Next 静态资源、字体和图片配置为长期缓存。导入 GitHub 仓库 `Drswith/deepseek-harness-landing` 后可以直接部署，不需要在 Netlify UI 中重复填写 Build command 或 Publish directory。

本项目是静态构建产物，不需要 Netlify Functions。视频文件约 18.9MB，Netlify 官方建议大文件使用 CLI 部署而不是浏览器拖放；通过 Git 连接部署时由 Netlify 构建系统处理。

## 文件

- `site/harness/`：可独立提供服务的 HTML、Next.js 客户端产物、RSC 数据、字体、图片和视频，约 21MB。
- `tools/serve.mjs`：零依赖静态服务器，含视频 Range、正确 MIME、目录首页与真实 404。
- `netlify.toml`：Netlify 发布目录、构建校验、本地开发代理、路由重定向和响应头。
- `tools/netlify-build.mjs`：部署前检查 publish directory 中的入口、路由、样式、视频和本地地域 fixture。
- `tools/localize.mjs`：把地域请求改为本地固定 CN 响应；其余页面运行代码保留。
- `RECON/asset-manifest.json`：下载来源、字节数、原始 SHA-256；`localization.json` 记录唯一 bundle 修改。
- `RECON/screenshots/`：参考站、本地、差异图、全页图和交互截图。
- `CLONE_REPORT.md`：实验结论和局限；`CLONE_AUDIT.md`：验证细节；`TEARDOWN.md`：动效与重构分析。

## 复验

浏览器操作全部使用 `ego-browser`。原采集 TaskSpace 已结束；复跑前需为本轮任务取得有效 TaskSpace，准备参考页和本地页，再传入 `LAB_SPACE_ID`。页面标签默认为 `p1` 和 `p2`，可用 `LAB_REFERENCE_PAGE`、`LAB_LOCAL_PAGE` 覆盖。

```sh
# 在仓库根目录执行，将 123 替换为本轮有效的 TaskSpace ID。
LAB_ROOT="$PWD" LAB_SPACE_ID=123 ego-browser nodejs < tools/compare.mjs
npm run audit
```

`capture.mjs` 会重新下载官方产物并覆盖 `site/`，只用于重新采集；之后必须再执行 `node tools/localize.mjs`。正常预览不需要访问官方站。

`npm run diff:screenshots` 可重新计算已有截图差异；需提供 `pngjs` 和 `pixelmatch`，默认从 Node 模块路径解析，也可通过 `LAB_NODE_MODULES` 指向含这两个库的目录。预览和 `npm run audit` 不需要这些依赖。截图统计只比较首屏静态层，不代表动态全页逐像素相同。

## 下一阶段

本轮验证“视觉和交互能否忠实本地复现”。若决定继续，将镜像留作基准，另建可维护的 React/Next 源码：逐个重建导航、Hero、功能展示、视频、CTA 和国际化，并用同一套截图回归。不要把压缩 bundle 当成业务源码直接合入项目。
