# 修车工具：内置 imagegen 生成记录

生成日期：2026-10-29。使用内置 `image_gen`，每个工具单独调用，`transparent_background: true`。
第一轮纹理过密，未接入。第二轮以第一轮工具为编辑目标、既有消防车为画风参考，减掉纹理。采用图保留原始 alpha，运行时仅缩放到最大384px。
母版消防车：`public/assets/illustrations/unified-v3/fire.png`。文件映射见同目录 `manifest.json`。

第一轮共同提示词：

> Use case: illustration-story. Asset: one transparent PNG sprite for a polished children's car repair game. Match the established car art visible in conversation: bold nearly-black rounded outlines, saturated clean colors, simple soft cel shading and crisp highlights, toy-like proportions. Three-quarter shallow perspective, fully visible, centered with generous transparent padding. No lettering, no face, no hands, no background, no border, no extra props, no drop shadow beyond the object. Recognizable at 80px. True alpha transparency.

分别追加：

- wrench: Draw ONE sturdy open-ended mechanic's wrench, diagonal from lower left handle to upper right open jaw. Brushed silver-blue metal head, rounded teal rubber lower grip, jaw opening clearly visible. Simplify small details, solid friendly shapes.
- cloth: Draw ONE folded golden-yellow microfiber cleaning cloth, rounded soft square silhouette, folded corner visible, a few broad fabric folds and darker ochre edge. Make it plainly a soft cloth, not a book, envelope or sponge.
- screwdriver: Draw ONE short sturdy mechanic's screwdriver, diagonal from lower left chunky warm coral-orange handle to upper right silver-blue shaft and simple straight flat tip. Thick toy-like handle, coherent dark outline, avoid tiny marks.

第二轮最终提示词（`${id}` 分别替换为 wrench、cloth、screwdriver）：

> Use case: style-transfer. First image is the edit target: the ${id} sprite. Second image is style reference only (red cartoon fire truck). Simplify the tool to match the truck's clean bold cartoon illustration. Preserve recognizable tool silhouette and color. REMOVE ALL glow, aura, shadows and background outside the dark object contour; every pixel outside the object must be truly transparent. Remove photographic texture (especially fabric grain or brushed-metal streaks); use broad flat color patches with only one soft cel-shadow and one crisp highlight. Smooth solid black contour, no micro-detail. Tool alone, no truck in output, no text, no face, centered and fully visible. The cloth must remain a folded soft yellow cloth with only three broad folds. Output ready-to-use transparent PNG for a children's game.

检查记录：原图 RGBA、有透明像素；在游戏米白工作台实际显示，识别为擦布/扳手/螺丝刀，没有黑底；细节明显少于第一轮。后续深色/浅绿对照检查仍列在全站验收台账。

## 行人素材与最终检查

行人源图：`pedestrian-source.png`，对应内置生成输出 `exec-1aaf427b-e539-4443-8062-e05ac29da3ce.png`。设计说明：单个正在迈步的儿童卡通行人，深色清晰轮廓、绿色上衣、黄色长裤、蓝色小提袋，独立透明背景；用来替换路口里的脚印角色，功能按钮仍可用脚印图标。本段为设计说明归档，不冒充原始调用提示词的逐字副本。

2026-10-30 已将四张运行图放在米白、浅绿、深色底上逐一检查：没有不透明底、白边或主体裁切。工具在维修工作台与动作中使用同一 PNG；行人在路口过街。检查图见 `output/playwright/premium-assets-mattes.png`。
