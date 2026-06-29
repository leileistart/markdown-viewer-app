# Markdown 阅览室

轻量、美观、智能的 Markdown 文件浏览器。

## 功能特性

- **沉浸阅读** - Markdown 完美渲染，代码语法高亮，图片显示，目录导航
- **渐进编辑** - 从只读到完整编辑的平滑过渡，Office 风格工具栏
- **智能标签** - 自动推荐标签，快速分类管理文件
- **学习助手** - 内置 Markdown 教程，新手友好
- **时间轴历史** - 可视化阅读轨迹，按日期分组展示
- **深色/浅色主题** - 一键切换，记住你的选择
- **快捷键** - Ctrl+O 打开文件、Ctrl+F 搜索、Ctrl+B 加粗等

## 截图

<!-- TODO: 添加截图 -->

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://www.rust-lang.org/tools/install) (Tauri 打包需要)
- Windows 10/11

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 纯前端开发
npm run dev

# Electron 开发模式
npm run electron:dev

# Tauri 开发模式（需要先安装 Rust）
npx tauri dev
```

### 构建打包

```bash
# Electron 便携版 (~88MB)
npm run electron:build

# Tauri 安装包 (~5-8MB)
npx tauri build
```

> **国内网络提示**：打包 Electron 时如果超时，请设置镜像源：
> ```powershell
> $env:ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/'
> $env:ELECTRON_BUILDER_BINARIES_MIRROR = 'https://npmmirror.com/mirrors/electron-builder-binaries/'
> ```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 样式 | Tailwind CSS 4 |
| Markdown 解析 | markdown-it |
| 代码高亮 | highlight.js |
| 桌面框架 | Electron / Tauri |
| 构建工具 | Vite 8 |

## 项目结构

```
markdown-viewer-app/
├── src/                    # React 前端源码
│   ├── App.tsx             # 主应用组件
│   ├── OfficeEditor.tsx    # Markdown 编辑器
│   ├── TagManager.tsx      # 标签管理组件
│   ├── tutorialData.ts     # Markdown 教程数据
│   └── ...
├── src-tauri/              # Tauri 后端 (Rust)
├── electron.cjs            # Electron 主进程
├── package.json
└── vite.config.ts
```

## 快捷键

| 操作 | 快捷键 |
|------|--------|
| 打开文件 | `Ctrl + O` |
| 搜索 | `Ctrl + F` |
| 保存 | `Ctrl + S` |
| 设置 | `Ctrl + ,` |
| 加粗 | `Ctrl + B` |
| 斜体 | `Ctrl + I` |
| 插入链接 | `Ctrl + K` |
| 命令面板 | `/` (编辑模式) |
| 返回/关闭 | `Esc` |

## 许可证

[MIT License](LICENSE)

## 致谢

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Electron](https://www.electronjs.org/)
- [Tauri](https://tauri.app/)
- [markdown-it](https://github.com/markdown-it/markdown-it)
- [highlight.js](https://highlightjs.org/)
