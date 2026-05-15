# PPT Repaint

AI 驱动的 PPT 重绘工作台。导入 PPT 页面截图或 PDF，通过 gpt-image-2 对单页或整套幻灯片进行美化、重绘、风格统一，然后导出为 PPTX。

纯前端应用，无需后端服务器，所有数据存储在浏览器本地。

## 特性

- 导入图片（多图批量）或 PDF 逐页导入
- 单页 AI 重绘（基于 gpt-image-2）
- 多版本对比与一键切换
- 拖拽排序幻灯片
- 导出为 PPTX
- 纯浏览器运行，数据持久化到 IndexedDB
- 用户自行提供 OpenAI API Key，密钥仅存储在本地

## 技术栈

React 19 + TypeScript + Vite 8 + Tailwind CSS + Zustand

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

1. 打开应用，点击「+」导入图片或 PDF
2. 点击右侧面板的设置图标，配置 OpenAI API Key
3. 在右侧编辑面板输入重绘指令，AI 将生成新版本
4. 在右侧面板切换不同版本进行对比
5. 完成编辑后导出为 PPTX

## 项目结构

```
src/
├── components/    # UI 组件（layout, slide, editor, ui）
├── services/      # 业务服务（image, importer, export, storage）
├── stores/        # Zustand 状态管理
├── types/         # TypeScript 类型
└── utils/         # 工具函数
```

## License

MIT
