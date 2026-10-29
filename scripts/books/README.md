# 绘本生成与维护

`scripts/books/` 是网站内的制作源码，`public/books/` 是生成结果。
不要单独修改 `public/books/rice.html` 或 `rice-offline.html`。

## 文件

- `books.json`：书架书目、封面、阅读地址、章节和进度存储键。
- `shelf.html`：书架模板，读取与绘本共享的本地阅读记录。
- `book.html`：四页内容、小游戏、大图弹窗和阅读布局。
- `reader-polish.css`：统一字体、触摸按钮、图片目录与手机布局。
- `playback.js`：单一音频播放器、加载提示、重试、暂停与切换。
- `word-highlighting.js`：按音频实际时间逐词高亮，暂停保留、停止清除。
- `reader-utils.js`：按需加载图片、图片重试、活动焦点与弹窗辅助。
- `content.json`：全部配音的逐字文稿。
- `audio-manifest.json`：同一次生成的词边界、文字位置和 MP3 SHA-256。
- `generate_audio.py`：生成固定配音和边界。修改文稿后必须重新生成对应音频。
- `build.py`：同时生成线上版、完全内嵌的离线版、封面入口和主屏幕配置。
- `verify.py`：校验所有音频、时间轴、图片和线上／离线版资源一致性。

## 构建

Python 需要 PyMuPDF、Pillow 和 qrcode。当前项目已有制作资料中的独立依赖目录，
可设置 `PYTHONPATH` 后，从网站根目录运行：

```powershell
python scripts/books/build.py --output-dir '../水稻互动绘本'
python scripts/books/verify.py
```

保留仓库的 `public/books/images/` 和 `audio/` 后，不依赖原始 PDF 即可重建。
如需要重新截取原稿，可通过 `--pdf` 明确指定原 PDF。
网站构建和发布使用 Sites 工作流，保留 `.openai/hosting.json` 的身份与访问权限。

## 必须保留的阅读约定

- 第一页是稻谷、大米、米饭的顺序朗读，不是答题。
- 高亮只用浅黄色底色，字重继承原文，不能因此改变换行。
- 四页内容、原始 PDF 页面、已有印章和进度键 `rice-book-v1` 保持兼容。
- iPad 竖屏使用完整页面；尺寸选择器和 iframe 预览工具不发布。
- 只在用户点击后开始播放；翻页、关弹窗和离开页面停止旧声音。
- 线上页面按需加载图片。离线版图片和声音全部内嵌，不依赖浏览器缓存。
- `/books` 和 `/books/` 指向书架；`/books/rice.html` 及其平台标准化地址直达绘本。
- 不更改现有游戏路由和站点访问权限。

添加新书时在 `books.json` 中维护独立的阅读地址、封面和存储键。
构建后检查多书卡片；当前只有一本书时使用封面与介绍并列的展示。

## 验证范围

检查记录见 `docs/books-audit.md`。浏览器尺寸检查不等于真实 iPad Safari 测试；
实机登录、自动连播和主屏幕启动仍需设备确认。
