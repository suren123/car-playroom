# 汽车小任务

给 4 岁左右孩子与家长一起玩的 iPad 汽车网页游戏。由 Sites 的 OpenAI 账户登录控制访问；无需另设家庭账号或密码。需要网络，使用大图、少文字、预生成中文语音和短音效；不计时、不扣分、不排名，也不生成注意力或情绪能力评分。

## 游戏入口

游戏统一在 `/game`，按两类进入：

- **汽车快递站**：大厅精选入口，也可以直接访问 `/game/delivery`。八个关卡模板，从看订单装货到视觉记忆、顺序记忆和记住剩余物品，每关三次配送。看好了再收起订单，可重看、求助、暂停和结束。

- **专注力小任务**：汽车分类、找不同、汽车数独、消防车听指挥。
- **规则与情绪小任务**：小汽车排队、红绿灯小司机、道路施工改道、修车小师傅、一起修桥。

分类从颜色、同车型逐步到用途；图片数独先示范 2×2，再玩 4×4。默认自动难度从简单开始，连续两局顺利完成会逐级增加挑战，多次卡住则下调下一局。家长可在“家长”入口固定选择简单或挑战。每局都有提示、暂停和主动结束入口，完成后由家长决定是否再玩。

排队游戏先让孩子选一辆自己的车，教学局先走，后续轮到第二位或第三位。提前点车只提示等待，不改变本局顺序。其他两辆由大人操作，屏幕无法识别实际是谁点了按钮。

家长模式自动记录每局完成或主动结束、选错、提前点击、提示、重试、暂停次数。记录同步至站点 D1 数据库，直到家长手动清空；不保存孩子姓名、照片、录音或逐次点击轨迹，也不根据点击推断真实情绪或独立能力。网络故障时未同步记录会留在本机浏览器，恢复网络后可在家长模式重试。

## iPad 使用

1. 用 Safari 打开 [https://haoran.awarejam67.chatgpt.site/game](https://haoran.awarejam67.chatgpt.site/game)。站点保留 Sites 的私密访问，请家长先登录创建网站时使用的 ChatGPT 账号。
2. OpenAI 登录后进入游戏；访问权限由创建 Sites 的 OpenAI 账户和 Sites 私密访问设置控制。
3. 在 Safari 点“共享 → 添加到主屏幕”。如果出现“作为网页 App 打开”，将其打开，再点“添加”。
4. 从主屏幕图标进入，确认登录、语音和横竖屏显示。Safari 与主屏幕网页 App 的登录状态可能不同，必要时重新登录。

根地址 `/` 会跳到 `/game`；旧域名会跳转到新域名。更换域名后需在新域名重新通过 OpenAI 账户登录，并建议用新地址重新添加主屏幕图标。提示使用预生成的中文女声；快递站提供全站静音、语音和音效设置。线下还可以拿真实玩具车练习轮流和送货。

## 本地开发

项目使用 React、Vinext、Cloudflare Worker、D1 与 Drizzle。Node.js 22.13 或以上。安装依赖后执行 `npm run db:generate`（仅在改动数据库结构时）、`npm run build`、本地 D1 迁移，再执行 `npm start`。本地迁移命令见 Sites Vinext starter 文档。

主要代码：`components/playroom.tsx`（大厅与原有游戏）、`components/road-games.tsx`（四款道路游戏）、`components/legacy-game.tsx`（修车与修桥）、`games/delivery/`（快递站规则与场景）、`games/vehicle-catalog.ts`（车辆目录）、`lib/records-api.ts`（家长记录接口）、`lib/speech.ts`（语音与音效播放）。

图片素材：60 张透明 PNG 原图放在 `assets/illustrations/individual/png/`。运行时导出位于 `public/assets/illustrations/v1/`，语义映射位于 `games/illustration-assets.ts`，可用 `npm run assets:export` 重新生成（需 Python Pillow）。快递站先接入该素材组；依赖车辆动态换色的旧分类游戏继续使用 SVG。

## 语音素材

固定提示音频保存在 `public/audio/`，对应文字与声音参数见 `manifest.json`。使用项目本地 `.venv-edge-tts` 环境中的 `edge-tts` 生成；该工具需要联网调用 Microsoft Edge 在线语音服务，但不需要 Azure 登录。重新生成：`python -m venv .venv-edge-tts`、`.venv-edge-tts\Scripts\python.exe -m pip install -r scripts/requirements-audio.txt`，然后运行 `.venv-edge-tts\Scripts\python.exe scripts/generate-game-audio.py`。

快递站新增语音使用 `scripts/generate-delivery-audio.py` 增量生成整句录音和 `lib/delivery-voice.json`；`scripts/generate-effects.py` 生成短音效合包及索引。素材的来源、代码位置和状态见 `docs/asset-catalog.md`。运行游戏时无需连接语音生成服务。

`/game` 使用 OpenAI 注入的已登录账户身份验证；Sites 的私密访问层保护页面和记录 API。记录写入和清空还校验同源请求。此项目不保存 OpenAI 账户凭证，也不设置额外家庭密码。

## 检查

- `npm run test:rules`
- `npm run check:assets`
- `npm run test:records`（使用独立的内存数据库，不清空本机记录）
- `node node_modules/typescript/bin/tsc --noEmit`
- 本地 D1 迁移及预览启动后可运行 `node scripts/test-records-local.mjs`；此脚本会清空**本地测试数据库**中的记录。

浏览器与设备检查结果记录在 `QA.md`。游戏用于亲子陪玩，不用于诊断或保证改善注意力与情绪调节能力。
