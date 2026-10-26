# 汽车小任务

给 4 岁左右孩子和家长一起玩的汽车游戏。联网使用，可通过 Safari 添加到 iPad 主屏幕。

## iPad 打开方式

1. Safari 打开 https://little-car-missions-haoran.awarejam67.chatgpt.site 。
2. 网站保留 Sites 的私密访问：家长先登录创建网站时使用的 ChatGPT 账号。
3. 在游戏登录页输入固定家庭账号 `parent` 和聊天里提供的家庭密码。
4. 轻点“共享 → 添加到主屏幕”。若有“作为网页 App 打开”，将其打开，再点“添加”。
5. 从图标重新打开，确认登录状态和声音。Safari 与主屏幕网页 App 的登录状态可能不同，必要时重新登录。

需要网络；不提供离线缓存。语音由设备提供，第一次点击任务时启用，设备没有中文语音时请家长读图示和文字提示。

## 新版：少文字、可重复玩

儿童页面改为大图、大按钮与短提示。

- **汽车分类**：六辆车，每局随机排序与配色；放到救援、运输、施工车站。
- **找不同**：左右车阵对照，点任意一边；简单两处差异，挑战三处。
- **汽车数独**：4×4 图片数独，行、列及 2×2 小车库不重复；简单缺三格，挑战缺六格。每道题独立验证唯一解。
- 每局重新出题；提供提示、换题、暂停，完成后手动“再玩一局”。难度在家长入口设置，从下一局生效。
- **修车、搭桥**：原有亲子任务保留在大厅下方入口，文字同步放大。

## 原有亲子游戏

- **修车小师傅**：三个任务，分别选择合适大小的轮胎、车顶灯和梯子。选错后给温和提示，可以提示、求助、重试或暂停。轮胎比较尺寸根据消防车实际显示大小调整。
- **一起修桥**：三座小桥，每座四块桥板，孩子与家长交替放置。亮起的头像提示当前回合；按钮不能识别实际操作的人，请大人陪玩。
- 完成后手动进入下一任务，三个任务结束回库。无自动下一轮、排行榜、广告或能力评分。不采集姓名、照片、录音。
- 切到后台会暂停进行中的任务，切回来检查登录；刷新页面会回到车库，不保存游戏进度。

## 源码与运行

使用 React / Vinext / Cloudflare Worker，保留 Sites 的构建与发布集成。

新版主要文件：`components/playroom.tsx`（游戏大厅）、`lib/replay-games.ts`（题目生成与规则）、`components/vehicle-art.tsx`（车辆插画）。原有游戏在 `components/legacy-game.tsx`。

原版主要文件：`app/game/page.tsx`（交互）、`lib/game.ts`（规则）、`lib/family-auth.ts`（服务端认证）、`components/car-art.tsx`（矢量插画）。

Node.js 22.13 或更高版本。安装依赖后执行 `npm run build`，再执行 `npm start`；默认预览地址为 http://127.0.0.1:5173 。

认证需要环境变量 `FAMILY_PASSWORD_HASH`、`FAMILY_PASSWORD_SALT`、`SESSION_SECRET`。本机预览保存在 Git 忽略的 `.dev.vars`，线上通过 Sites 的加密环境变量配置。密码使用 PBKDF2-SHA256（100000 次），会话为签名 Cookie，有效期七天，设置 HttpOnly / Secure / SameSite=Strict；登录和退出校验 Origin。未配置时拒绝登录，无默认后门。源码和发布包不包含家庭明文密码、密码校验值或会话密钥。

验证：`node scripts/test-replay.mjs`（200 个种子、两档难度的随机题与独立数独解验证）、`node scripts/test-games.mjs`、`node scripts/test-auth.mjs`（需要本地 `.dev.vars`，使用独立测试密码）、`node node_modules/typescript/bin/tsc --noEmit`。浏览器检查结果见 `QA.md`。

这是一款亲子游戏，不用于诊断、评估或保证改善注意力和情绪调节能力。
