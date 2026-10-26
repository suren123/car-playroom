# 汽车小任务

给 4 岁左右孩子与家长一起玩的 iPad 汽车网页游戏。由 Sites 的 OpenAI 账户登录控制访问；无需另设家庭账号或密码。需要网络，使用大图、少文字、中文设备语音；不计时、不扣分、不排名，也不生成注意力或情绪能力评分。

## 游戏入口

游戏统一在 `/game`，按两类进入：

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

根地址 `/` 会跳到 `/game`；旧域名会跳转到新域名。更换域名后需在新域名重新通过 OpenAI 账户登录，并建议用新地址重新添加主屏幕图标。设备语音会优先选择可用的中文女声，并放慢语速；声音自然度取决于 iPad 上安装的语音。线下还可以拿三辆真实玩具车练习轮流。

## 本地开发

项目使用 React、Vinext、Cloudflare Worker、D1 与 Drizzle。Node.js 22.13 或以上。安装依赖后执行 `npm run db:generate`（仅在改动数据库结构时）、`npm run build`、本地 D1 迁移，再执行 `npm start`。本地迁移命令见 Sites Vinext starter 文档。

主要代码：`components/playroom.tsx`（大厅与原有三款重复游戏）、`components/road-games.tsx`（四款新游戏）、`components/legacy-game.tsx`（修车与修桥）、`lib/replay-games.ts` 和 `lib/road-games.ts`（题目及规则）、`lib/records-api.ts`（家长记录接口）、`lib/speech.ts`（设备中文女声优先选择）。

`/game` 使用 OpenAI 注入的已登录账户身份验证；Sites 的私密访问层保护页面和记录 API。记录写入和清空还校验同源请求。此项目不保存 OpenAI 账户凭证，也不设置额外家庭密码。

## 检查

- `node scripts/test-replay.mjs`
- `node scripts/test-road.mjs`
- `node scripts/test-games.mjs`
- `node node_modules/typescript/bin/tsc --noEmit`
- 本地 D1 迁移及预览启动后可运行 `node scripts/test-records-local.mjs`；此脚本会清空**本地测试数据库**中的记录。

浏览器与设备检查结果记录在 `QA.md`。游戏用于亲子陪玩，不用于诊断或保证改善注意力与情绪调节能力。
