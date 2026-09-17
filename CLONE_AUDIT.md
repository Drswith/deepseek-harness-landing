# 实验验证记录

## 已执行

- `node --check tools/serve.mjs`：通过。
- `node tools/audit.mjs`：52 个资源 HEAD 200、字节数/哈希校验通过；51 原样，1 地址替换记录匹配。
- 视频 `Range: bytes=0-1023`：206、1024 字节、video/mp4；超范围 HEAD：416；缺失资源与编码路径穿越：404；根路径：308。
- `ego-browser nodejs < tools/capture.mjs`：三断点与页面/资源采集，52 成功、0 失败。
- `ego-browser nodejs < tools/compare.mjs`：三断点六分区尺寸/字体、图片尺寸一致，无溢出；本地观察到的资源错误和外部自动请求均为空。
- `node tools/pixel-diff.mjs`：首屏静态差异 0%、0%、0.175598%；仅 Canvas/滚动条屏蔽，非全页动态评分。
- 同一 ego-browser TaskSpace 内手工编排交互验收：中英文、命令 Tab/复制、移动菜单、视频播放/暂停/seek/倍速/全屏按钮、政策页导航。
- 阻断 HTTPS 的本地英文首页 smoke：Canvas 5，视频 readyState 4、时长 73.8 秒，采样错误数组为空。
- 当前仓库 `git status --short`：无输出。

## 证据索引

- `RECON/comparison.json`：三视口完整结构比较。
- `RECON/pixel-diff.json`：算法阈值与像素计数。
- `RECON/server-audit.json`：资源路径、哈希、MIME、服务器检查。
- `RECON/routes-verified.json`：中文政策页与英文首页/政策页。
- `RECON/animation-verified.json`：RAF 采样与 WebGL 调用次数；2D clearRect 计数仅代表该方法，不能推断所有 2D 动效是否运行。
- `RECON/video-seek.json`：暂停状态通过键盘从 30.482364 秒移动到 31.220364 秒。
- `RECON/offline-smoke.json`：阻断 HTTPS 后的英文首页加载证据；并非断开整台机器网络。
- `RECON/screenshots/`：live、static、diff、full 及移动菜单/视频/特性区域截图。

## 验证边界

source map 恢复、组件源码重建、跨浏览器/真机触摸、性能与无障碍审计均未完成。Escape 退出视频全屏未通过，退出按钮通过。初始采集截图可能含入场模糊，请以文件名包含 `-live`、`-static` 和 `-full` 的后续截图为准。未运行 web-clone 原有 CDP 脚本，改用用户指定的 ego-browser 流程；不宣称通过其原脚本门禁。

## 独立仓库迁移复验

2026-09-17，全部 137 个实验文件迁入 `deepseek-harness-landing`，迁移前后的文件路径/字节数/SHA-256 集合一致；现有 `.gitignore` 和 `LICENSE` 保持不变，原临时空目录移除。预览服务改为从新目录提供相同 URL。

迁移后对全部 `tools/*.mjs` 执行 `node --check`，再次运行 `npm run audit` 和 `npm run diff:screenshots`，结果与第一阶段一致。验证了两个浏览器脚本在缺少 `LAB_SPACE_ID` 时明确拒绝启动，避免复用已结束的会话。未重复浏览器视觉采集，截图重算使用既有证据；官网资源哈希保持原样。

提交检查发现官方播放器产物 `194.9af4cd38a39a29b3.js` 含尾随空白。为保持采集哈希，不格式化该文件；`.gitattributes` 仅对此文件关闭空白告警，并禁止对下载产物自动转换换行符。其余文件仍参与正常空白检查。
