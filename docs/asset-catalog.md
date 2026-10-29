**Car Playroom 0.3 素材清单**

图片：用户提供 60 张独立透明 PNG，原图保存在 `assets/illustrations/individual/png/`，VTracer 对照文件与预览在同目录。`scripts/export-illustrations.py` 按 alpha 可见范围裁切并导出至 `public/assets/illustrations/v1/`；用 `npm run assets:export` 重新导出（需要 Python Pillow）。`games/illustration-assets.ts` 保存稳定语义 ID 与源图对应；`components/illustration.tsx` 提供公共显示组件。全站普通车辆、货物和地点现统一使用 PNG，动态换色分类与分层修车保留手工 SVG，不使用自动描摹结果。

车辆：`games/vehicle-catalog.ts` 保存 12 个车辆 ID、名称、状态和版本；可编辑的矢量图形在 `components/vehicle-art.tsx`。首批六种旧车型使用兼容 ID，新车型采用同一视图与配色体系。

道具与场景：`games/delivery/model.ts` 中登记 30 种货物、14 个配送目的地。本次增加行李箱、背包、礼物、玩具、图书、野餐篮、苹果、蔬菜、鱼、牛奶、果汁、橙子、鸡蛋、鲜花、干草、油漆、急救箱、路障；增加住宅、学校、警察局、加油站、农场、温室、停车场、公交站、修车店。仓库仅为出发场景，不计入配送站点。每单仍按原关卡规则选择 1 或 2 件货物、2–4 个货架选项、1 或 2 站；两站选择区只展示本单两个站点。

扩充原图：新上传的 66 张 PNG 全部保留于 `assets/illustrations/delivery-expansion/originals/`，`import-map.json` 记录上传顺序与启用状态，`manifest.json` 记录尺寸、有效图案范围和 SHA-256。仅 27 张启用图片复制到 `public/assets/illustrations/delivery-v2/`；其余 39 张不会发布到静态目录或参与预加载。运行 `py scripts/import-delivery-expansion.py` 可从保留的原图重新导出；首次导入可加 `--upload-dir`。脚本依赖 Pillow，原 PNG 字节不改动；生成的 `games/delivery/illustration-frames.ts` 让组件通过 SVG 显示窗口排除透明留白，货物按比例居中，场景建筑沿底部对齐。SVG 仅引用已准备的 PNG Blob，不新增矢量素材下载。

同一种包裹／木箱／轮胎及已有站点不重复新增；两种粮食袋、用途不明的桶袋、第二个急救箱、第二座时钟建筑、办公楼和岗亭等保留备用。`confusionGroups` 约束整个货架，禁止相似物品同时作为正确答案或干扰项。生成器从最近 5 单签名读取出现次数，优先选择少出现的货物与站点；`preferredStops` 提供多目的地的自然搭配偏好，不是额外答题判定。种子与近期列表共同决定可复现的订单，旧近期偏好兼容，无局面恢复。

语音：旧语音映射在 `lib/audio-manifest.json`，快递站使用 `lib/delivery-voice.json` 和 `public/audio/delivery/`，目前为 28 条固定提示＋48 条可复用片段（30 个物品名、14 个站点名、4 个引导词／连接词），合计 76 个文件。页面与对应固定语音中的「装备」统一为「货物」。使用 `scripts/generate-delivery-audio.py` 按录音文本增量生成；物品和站点名称通过 Node 读取模型，避免重复手工维护。工具依赖 `scripts/requirements-audio.txt`。生成依赖在线 Edge TTS 服务，游戏运行时使用已生成文件，不要求 Azure 登录。

订单与路线通过 `lib/delivery-speech.ts` 组合，例如「这次要送＋木箱＋和＋轮胎＋先去＋工地＋再去＋消防站」。片段在进入游戏时完成下载和解码，播放时裁去两端多余静音、加入短停顿，拼成一个临时 WAV，交给现有播放器一次播放。播放完毕、重播、静音、暂停或退出均释放临时对象 URL；退出游戏释放片段解码数据。不会逐段重新请求网络，也不调用在线 TTS。新增名称时更新模型、图片映射，运行语音生成脚本，再运行 `npm run resources:generate` 和资源检查。固定提示继续保留整句以维持自然语调。

音效：`scripts/generate-effects.py` 中的合成参数是可编辑源，构建出 `public/audio/effects.wav` 和 `lib/effects-manifest.json`，索引以秒记录 12 个片段的起点和时长。该合成音效由项目脚本生成。

2026-10-29 统一重绘：消防车、仓库、消防站、工地、商店、医院、工厂、干草、橙子，共 9 张。使用内置生图模型，以既有公交车、包裹、修车店为参考；高清生成原图、提示词与导出清单保存在 `assets/illustrations/unified-v3/`。原有版本全部保留，新运行文件在 `public/assets/illustrations/unified-v3/`。车辆与建筑长边 768px、货物长边 384px；只裁透明留白、等比缩小并添加透明安全边，不放大旧图。运行 `node scripts/export-unified-art.mjs` 从归档原图导出（使用项目 Sharp），再运行 `npm run resources:generate` 更新尺寸与内容哈希。

全站 62 张启用 PNG 逐项处理及替换关系见 [审查清单](unified-art-audit.md)，[新旧对比](unified-art-comparison.html) 提供三种检查背景与 48/64px 预览，[全部素材](unified-art-gallery.html) 使用实际显示窗口。运行 `node scripts/review-unified-art.mjs` 可刷新这些页面；仅用于开发验收，不加入游戏资源下载。

首页八款游戏使用 `game-cover-art.tsx` 组合专属玩法图标，数独／找不同沿用原有结构。分类 SVG 沿用判定颜色；修车候选与装车零件共用图形，竖梯保留三根横档、装车后仅旋转，轮胎显示尺寸同步测量。道路、灯、桥等使用组件绘制，功能图标保持线性风格。

进入各游戏前完整准备启用图片与声音；原图、备用素材及对比页不进入预加载。新九张运行 PNG 合计 753,366 字节。快递站当前 139 项、4,397,257 字节（4.19 MiB），低于 6 MiB；语音仍为 996,048 字节。旧游戏新增图片均加入相应清单，图片组件读取已解码 Blob，退出后由原资源生命周期释放。
