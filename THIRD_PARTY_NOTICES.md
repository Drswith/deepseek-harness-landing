# 第三方内容说明

本项目是独立、非官方的页面还原实验，与 DeepSeek 不存在官方关联。

`site/harness/`、`RECON/source/`、`RECON/rendered.html`、截图和部分采集记录包含来源于 <https://www.deepseek.com/harness/> 的第三方内容，包括 Logo、品牌名称、文案、字体、产品截图、视频及编译后的 JavaScript/CSS。采集日期为 2026-09-17；来源、文件哈希及本地修改记录见 `RECON/asset-manifest.json` 和 `RECON/localization.json`。

根目录现有 MIT LICENSE 不能被解释为本仓库维护者对第三方内容的重新授权，也不授予 DeepSeek 品牌或商标使用权。参考页自身展示的“开源 · MIT”文案不等于已经核实全部官网资源均适用该许可。第三方内容的权利及适用许可仍归相应权利人；本实验没有完成逐项许可核验。

第二阶段 `public/` 中的媒体、字体、Logo 和图标，以及 `src/content/` 中的文案、政策文本和 `src/styles/tokens.css` 中的字体定义与设计变量，提取自上述第一阶段基准。`src/components/hero/shaders.ts` 及相关动效参数含从参考页客户端产物整理的着色器实现；这是还原实现，不是找回的官网源代码。

本仓库提供独立源码、第一阶段比对基准及 Netlify 配置，不提供官方网站身份声明。后续产品化、重新分发或公开部署前，应核实相关许可并按实际需求替换品牌、截图和文案。
