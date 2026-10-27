**Car Playroom 0.3 素材清单**

图片：用户提供 60 张独立透明 PNG，原图保存在 `assets/illustrations/individual/png/`，VTracer 对照文件与预览在同目录。游戏运行时使用原 PNG，不使用自动描摹结果。`scripts/export-illustrations.py` 按 alpha 可见范围裁切并导出至 `public/assets/illustrations/v1/`；用 `npm run assets:export` 重新导出（需要 Python Pillow）。`games/illustration-assets.ts` 保存稳定语义 ID 与源图对应；`components/illustration.tsx` 提供公共显示组件。当前快递站使用车辆、货物、地点和自然物 PNG，其他小游戏逐步迁移。

车辆：`games/vehicle-catalog.ts` 保存 12 个车辆 ID、名称、状态和版本；可编辑的矢量图形在 `components/vehicle-art.tsx`。首批六种旧车型使用兼容 ID，新车型采用同一视图与配色体系。

道具与场景：`games/delivery/model.ts` 中登记 12 个道具 ID；`games/delivery/art.tsx` 按玩法状态组合仓库、消防站、工地、道路、树木与货物。通用背景和道路几何由 CSS 构成，场景物件来自独立透明 PNG。

语音：旧语音映射在 `lib/audio-manifest.json`，快递站的完整中文句子在 `lib/delivery-voice.json` 和 `public/audio/delivery/`；使用 `scripts/generate-delivery-audio.py` 按录音文本增量生成，工具依赖 `scripts/requirements-audio.txt`。生成依赖在线 Edge TTS 服务，游戏运行时使用已生成文件，不要求 Azure 登录。

音效：`scripts/generate-effects.py` 中的合成参数是可编辑源，构建出 `public/audio/effects.wav` 和 `lib/effects-manifest.json`，索引以秒记录 12 个片段的起点和时长。该合成音效由项目脚本生成。

已有旧游戏车辆图仍由 SVG 绘制，汽车分类依赖动态换色，暂不替换。短音效已经合包。新图素材按 ID 拆分、按页面按需加载，不在首次进入大厅时预载全套 60 张图。大图集应按实际游戏资源组和测量结果制作。
