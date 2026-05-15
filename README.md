# Oh My PPT Web

纯前端 AI PPT 修改工作台。导入已有 PPT 页面截图或 PDF，通过 gpt-image-2 对单页或整套 PPT 进行美化、重绘、统一风格和导出。

## 特性

- 导入图片（多图）或 PDF 逐页导入
- 单页 AI 编辑（gpt-image-2）
- 多版本对比与切换
- 导出为 PPTX / PDF / 图片 ZIP
- 纯浏览器运行，无需后端，数据存储在 IndexedDB
- 用户自行提供 OpenAI API Key

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

1. 打开应用后，点击「导入图片」或「导入 PDF」添加幻灯片
2. 点击右上角设置图标，配置 OpenAI API Key
3. 在右侧编辑面板输入修改指令，AI 将生成新版本
4. 在右侧面板切换不同版本进行对比
5. 完成编辑后导出为 PPTX

## 项目结构

```
src/
├── app/           # 应用入口（router, providers）
├── pages/         # 页面组件
├── components/    # UI 组件（layout, slide, editor, ui）
├── services/      # 业务服务（image, importer, export, storage）
├── stores/        # Zustand 状态管理
├── hooks/         # 自定义 hooks
├── constants/     # 常量定义
├── types/         # TypeScript 类型
└── utils/         # 工具函数
```

## License

MIT
