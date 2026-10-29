# 汽车小镇体验升级：实施与验收台账

2026-10-30。本地版本已完成；未提交、推送或发布。范围为4–6岁、首页及十款游戏。以下结论以本机截图、短录屏、浏览器操作和规则检查为依据，不代表真实iPad或儿童试玩结果。

## 逐款问题与落实

| 游戏 | 原问题 | 本次实际改动 | 验收证据（output/playwright） |
|---|---|---|---|
| 修车 | PNG选车进入游戏变成通用SVG；工具简单；擦布安装零件；13px字；完成只勾选 | 同源PNG遮罩与零件；擦布清洁、扳手装轮和紧固、螺丝刀修灯/盖板；六车型专属区域；3秒试车并停住。移除会碰到车顶的“试车完成”装饰字，挖掘机使用“履带轮” | premium-repair-six-qa.txt、premium-identity-*.png、premium-repair.webm |
| 排队 | 朝向与队首冲突；前后线索小；没有实际出发 | 车位从左到右1→N，队首与车头朝左、可视关系、车辆落位、1→N依次向左出发；上方保留正确队伍，所选车一定入题 | premium-final-queue-qa.txt、premium-queue.webm |
| 修桥 | 桥与车轮落地不清；缺少连续过桥；灰色候选残留 | 同源车辆底部定位、连续桥面、2.8秒过桥；完成展示实际桥板和对岸小车 | premium-final-bridge-qa.txt、premium-bridge.webm |
| 分类 | 换色SVG另换画风；归位不明确；完成只剩灰卡 | 原PNG车身区域换色，550ms归位，整理结果保留；竖屏四列候选避免溢出 | premium-final-sort-qa.txt、premium-sort-portrait-final-qa.txt、premium-sort.webm |
| 红绿灯 | 侧视车纵向滑动；鞋印充当行人 | 双向水平车道、正确朝向、实际行人PNG、1.2秒通行，救援/行人优先保持 | premium-final-traffic-qa.txt、premium-traffic-crossing-review.png、premium-traffic.webm |
| 听指挥 | 正确后只有文字，没实际巡游 | 同一辆车按本局2–4站巡游3.2秒，逐站到达并停在末站 | premium-final-listen-qa.txt、premium-listen.webm |
| 改道 | 画完没试车与转向 | 对应12辆车的俯视素材，沿实际路径行驶3.2秒，按方向转弯，保留终点与路径 | premium-final-detour-qa.txt、premium-detour.webm |
| 快递 | 头部样式与字号不一致，横屏高度拥挤 | 共用头部、订单/货架字号统一；听规则与阶段标题同行；保留成熟装卸和回库成果，记忆关盖住订单 | premium-delivery-1024-qa.txt、premium-delivery-768-qa.txt、premium-delivery-level5-qa.txt、premium-delivery.webm |
| 数独 | 外层控制不同；SVG图窗被旧img样式缩成小车 | 统一头部和图窗尺寸；保留2/3/4行列规则、双级提示和稳定完整棋盘庆典 | premium-sudoku-{1024,768}-qa.txt、premium-sudoku-final-qa.txt、premium-sudoku.webm |
| 找不同 | 完成反馈弱；主体图窗比例不统一 | 两边同步确认、完成柔和反馈及差异车辆对照；原比较区稳定，修正SVG尺寸 | premium-difference-{1024,768}-qa.txt、premium-difference-final-qa.txt、premium-difference.webm |
| 首页 | 入口主体比例不一致；分类仍是另一套车 | 统一PNG构成玩法图标，保留排序与路径；字重、对比和家长触摸区域统一 | premium-home-{1024,768}.png、premium-interface-qa.txt |

## 视觉验收

- 1024×768、768×1024逐款实际操作，保存选择、过程、错误和完成截图；七款三档各横竖屏完成，共42局。数独、找不同三档各横竖屏完成；快递任务8两种视口及任务5竖屏三单配送；修车额外完成六车型。
- 42个首页/选择/游戏状态进行实际computed-style审查：必要中文≥18px、启用触摸区域≥56px、文字对比达到对应大字/普通字阈值、无横向溢出；游戏选择/操作页均在视口内，首页允许正常纵向滚动。完成按钮另由逐局脚本检查。
- 六车型选择—故障—完整成果并排检查；原图母版、正确裁片一致。工具/动作对应，车轮或履带轮与对应车型匹配。
- 十款短录屏逐帧抽取检查落位、维修、过桥、卸货、放行、巡游、转弯和完成保留。短片末尾的换挑战由验收主动点击，游戏不自动跳关。导出的MP4不含音轨。
- 新增16张透明PNG（3工具、1行人、12俯视车）在米白、浅绿、深色上检查。搅拌车/吊车第一稿不符配色或轴数，已重绘并隔离弃用稿。高清源文件和生成记录保留，不进入预加载。

## 功能与资源验收

| 检查 | 实际结果 |
|---|---|
| 规则 | 最终test:rules通过：七款3档×200种子=4200局；数独、找不同各3档×240；快递8关×200及既有反馈/语音/规则回归；改道路径关键帧、转向与终点断言通过 |
| 记录/导航/局次 | 最终test:records、test:navigation、test:rounds通过；浏览器主动返回/重开未完成、完成后返回不重复；准备页不记局，刷新/原生后退不补交 |
| 声音 | 共用开关实测静音立即停止、静音下听规则不启动、开启后恢复、打开家长停止；全部使用预载Blob。premium-sound-qa.txt；未测扬声器听感 |
| 暂停/动作 | 路口行人和车辆位置实测冻结，维修计时暂停；重复操作不重复推进；返回取消旧回调；错误线索可撤回并再提示；减少动态效果静态成果正常 |
| 后台 | 受控visibilitychange模拟：准备完成仍等待前台；过程暂停；完成成果保留。未把模拟称为iPad系统挂起测试 |
| 媒体复用 | 准备完成后拦截PNG/MP3/WAV，实际完成、提示、换车辆、再玩；游戏过程新增媒体请求0，逐局pageerror0 |
| 故障恢复 | 浏览器404阻止挂载和记局，重试恢复；延迟资源返回后不重开；加载器测试覆盖超时、损坏、取消、缓存不可用与重试 |
| 连续释放 | 十游戏连续两轮20次进入退出，第二轮全部零资源下载；统计4404个对象URL全部释放，各次回首页运行动画0、准备阶段记录0 |
| 存储与兼容 | 仅游戏专用Cache Storage；无新局面存档，无新API或数据库结构；设置/历史记录沿用；本地测试记录接口隔离，未写入真实家长历史 |
| 长按 | 游戏插画contextmenu/dragstart被阻止，游戏外正常；保留浏览器缩放，家长面板可选字。iPad原生长按仍需实机复核 |
| 最终静态检查 | 资源清单哈希、素材、TypeScript、相关ESLint通过；ESLint 0错误3警告：2处取消令牌ref cleanup、1处原生img优化建议 |
| 最终构建 | npm run build通过。Vinext既有路由静态分类提示不影响构建；没有发布行为 |

本机Windows Chrome 156，开发服务器。七款完成后的3.4秒窗口各采样约205帧，P95帧间隔约16.8ms，无超过50ms的采样；路口窗口主要是完成后的静态画面，不能据此宣称整局或真实iPad稳定60fps。连续切换heap约35.9–60.3MB，未强制GC，只能确认所跟踪的URL和动画已释放，不能证明绝对无内存泄漏。

最终脚本日志：premium-final-{rules,records,navigation,rounds,resources,assets,manifest,types,lint,build}.log；汇总premium-final-checks.json。补充交互日志premium-lifecycle-qa.txt、premium-feedback-qa.txt、premium-resources-qa.txt。

## 参考、交付与明确限制

实际查看[SmartGames Trucky 3](https://www.smartgames.eu/uk/one-player-games/trucky-3)官方三步图示，借鉴具体任务、有限部件、可观察的错误及装好后的成果；查看[Good Sudoku](https://www.playgoodsudoku.com/)官方提示界面，借鉴先指出相关关系再辅助下一步。看的是网页分步/界面演示，不声称观看视频或证实教育效果；未复制参考素材。

- 本地游戏：http://127.0.0.1:5173/game 。验收对比页：output/premium-review/index.html，由scripts/build-premium-review.mjs生成，含十款MP4、前后对照、六车型母版图、三底色检查及规范/清单。
- 统一规范见premium-visual-system.md；全部启用图片映射见premium-assets.md；源图、提示与修订记录见assets/illustrations/workshop-v4和overhead-v4。
- **真实iPad Safari、实际扬声器听感、手指触控和系统挂起均未实测；没有儿童试玩结果。** 桌面检查不能替代这些项目。
- 保留的部分旧车型源图约267–288px，大场景边缘比新版消防车柔软；使用同一素材，不以放大冒充高清。未扩大到重画所有车型。
- 开发环境可见既有React多渲染器警告；本次操作无pageerror。未把开发提示清除作为玩法改造的一部分。
- 本轮未提交、未推送、未发布；无关绘本文件未改动。
