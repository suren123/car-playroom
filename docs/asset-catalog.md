**Car Playroom 0.2 素材清单**

车辆：`games/vehicle-catalog.ts` 保存 12 个车辆 ID、名称、状态和版本；可编辑的矢量图形在 `components/vehicle-art.tsx`。首批六种旧车型使用兼容 ID，新车型采用同一视图与配色体系。

道具与场景：`games/delivery/model.ts` 中登记 12 个道具 ID；可编辑的矢量路径、三种场景与目的地图形在 `games/delivery/art.tsx`。这些图形是项目源码中的原创绘制素材，不依赖外部图片下载。

语音：旧语音映射在 `lib/audio-manifest.json`，快递站的完整中文句子在 `lib/delivery-voice.json` 和 `public/audio/delivery/`；使用 `scripts/generate-delivery-audio.py` 按录音文本增量生成，工具依赖 `scripts/requirements-audio.txt`。生成依赖在线 Edge TTS 服务，游戏运行时使用已生成文件，不要求 Azure 登录。

音效：`scripts/generate-effects.py` 中的合成参数是可编辑源，构建出 `public/audio/effects.wav` 和 `lib/effects-manifest.json`，索引以秒记录 12 个片段的起点和时长。该合成音效由项目脚本生成。

现有车辆和道具是可缩放的代码内 SVG；短音效已经合包。需要引入外部图片、音乐或音效时，在本清单新增原始来源、许可、版本和处理方式。大图集应按实际游戏资源组和测量结果制作。
