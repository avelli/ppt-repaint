# PPT Repaint

厌倦了豆包、Kimi、千问等网页端大模型生成 PPT 的单调和千篇一律，又不知道该如何修改 NotebookLM 生成的图片型 PPT？本工具正是为此而诞生的。

<br>

[![Vercel 在线体验](https://img.shields.io/badge/Vercel-%E5%9C%A8%E7%BA%BF%E4%BD%93%E9%AA%8C-black?style=for-the-badge&logo=vercel&logoColor=white)](https://ppt-repaint.vercel.app/)
&nbsp;&nbsp;&nbsp;

</div>

<br>

AI 驱动的 PPT 重绘工作台。导入已有的 PPT 页面截图或 PDF，通过 gpt-image-2 对单页或整套幻灯片进行美化、重绘、风格统一，然后导出为 PPTX。

纯前端应用，无需后端服务器，所有数据存储在浏览器本地。

## 使用截图
<img width="1917" height="1006" alt="image" src="https://github.com/user-attachments/assets/027127ad-e285-4898-9d77-f1c94e5ecd4f" />

## 特性

- **多格式导入** — 支持 PNG/JPEG/WebP/GIF/BMP 批量导入，也可直接导入 PDF 逐页转换（但不支持PPTX导入）
- **AI 重绘** — 基于 gpt-image-2，输入自然语言指令即可对幻灯片进行重绘
- **多版本管理** — 每次重绘生成独立版本，支持一键切换与对比
- **拖拽排序** — 自由调整幻灯片顺序
- **PPTX 导出** — 一键导出为标准 PPTX 文件
- **隐私优先** — 纯前端运行，API Key 和所有数据仅存储在浏览器本地（IndexedDB + localStorage）

## 技术栈

React 19 · TypeScript · Vite 8 · Tailwind CSS · Zustand

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 使用说明

1. 打开应用，点击工具栏的「+」导入图片，或点击 PDF 图标导入 PDF 文件
2. 点击右侧面板的设置图标，配置 OpenAI API Key 和模型参数
3. 在右侧编辑面板输入重绘指令（如"统一为商务蓝色风格"），AI 将生成新版本
4. 在右侧面板的版本列表中切换对比，选择满意的版本
5. 完成编辑后点击导出按钮，下载 PPTX 文件

## API Key 配置

本工具需要 OpenAI API Key 才能使用 AI 重绘功能。

1. 前往 [OpenAI Platform](https://platform.openai.com/api-keys) 创建 API Key
2. 打开应用后，点击右侧面板顶部的设置图标（齿轮）
3. 在弹窗中填入以下信息：
   - **API Key** — 你的 OpenAI API Key（以 `sk-` 开头）
   - **Base URL** — 默认为 `https://api.openai.com/v1`，如使用第三方代理可修改
   - **模型** — 默认为 `gpt-image-2`
4. 点击保存，配置会持久化到浏览器 localStorage

> 注意：API Key 仅存储在你的浏览器本地，不会上传到任何服务器。如使用第三方中转服务，请确认其可信度。

## 项目结构

```
src/
├── components/    # UI 组件（layout, slide, editor, ui）
├── services/      # 业务服务（image, importer, export, storage）
├── stores/        # Zustand 状态管理
├── types/         # TypeScript 类型
└── utils/         # 工具函数
```

## 致谢

本项目的开发受到以下开源项目的启发，特此感谢：

- [gpt_image_playground](https://github.com/CookSleep/gpt_image_playground) — 图片生成与编辑的交互模式、API 调用方式和本地历史管理
- [oh-my-ppt](https://github.com/arcsin1/oh-my-ppt) — PPT 工作台布局、页面列表交互和编辑器设计思路

## License

MIT
