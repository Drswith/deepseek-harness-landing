# 实验记录

实验最初在独立临时目录完成，第一阶段现已迁入 `/Users/drs/workspaces/personal/deepseek-harness-landing`；`deepseek-harness` 主仓库未修改。迁移前后全部 137 个文件共 33,790,568 字节，路径与内容集合的 SHA-256 一致：`7dd6bfdcac5585d50647bc074a05082f9d34b70f7876e266de6e6a2ed55fe420`。之后仅调整工具的目录/会话配置、包名与说明，官网产物不变。原临时空目录已移除。

网络优先使用已验证的系统代理 `127.0.0.1:7897`；浏览器采集通过 ego-browser 进行，本地预览直连 loopback。

采用 `nexu-io/open-design` 的 `web-clone` 中“真实资源采集—本地基准—截图验证”的顺序。用户指定参考页，因此跳过 frontend-app-builder 的概念图阶段；未添加新的视觉设计。两个子代理均为 `gpt-5.6-luna`，分别负责临时静态服务器和静态产物拆解。

官网包含 Next App Router、真实 WebGL shader、Canvas/R3F、滚动驱动的特性展示和约 73.8 秒视频。先保留已部署产物建立高保真基准，暂未重建组件源码。官方 Logo、文字和产品图仅在本地实验中保留，外部导航链接仍指向官方及社区目的地。

地域响应固定为此次参考站实际返回的 CN 分支，不保存原响应的 IP；因此未验证非 CN 分支。CSS 中有晚于普通规则的 Google Fonts @import 字符串，当前 Chromium 运行未观察到相关请求；不能把网络采样等同于所有浏览器、所有状态的永久离线保证。
