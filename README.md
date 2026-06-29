<div align="center">

# 📝 Markdown 阅览室

**轻量、美观、智能的 Markdown 文件浏览器**

阅读为主 · 编辑为辅 · 学习友好

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev/)
[![Electron](https://img.shields.io/badge/Electron-42-47848F?logo=electron)](https://www.electronjs.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2-FFC131?logo=tauri)](https://tauri.app/)

</div>

---

<p align="center">
  <strong>厌倦了用记事本看 Markdown？觉得 Obsidian 太重？</strong>
</p>
<p align="center">
  <strong>Markdown 阅览室</strong> — 专为阅读而生，给你最美观的 Markdown 阅读体验。
</p>
<p align="center">
  打开即用，双击运行，无需安装，仅 <strong>88 MB</strong>。
</p>

---

## ✨ 为什么选择 Markdown 阅览室？

<table>
<tr>
<td width="50%" valign="top">

### 🎯 专注阅读
- 完美渲染 Markdown 语法
- 代码块语法高亮（支持 100+ 语言）
- 图片、表格、数学公式
- 长文档自动生成目录导航

</td>
<td width="50%" valign="top">

### ✏️ 随时编辑
- Office 风格工具栏
- 丰富的快捷键支持
- 命令面板快速插入
- 编辑后实时预览

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🏷️ 智能管理
- 智能标签自动推荐
- 收藏重要文件
- 阅读历史时间轴
- 全文搜索秒级响应

</td>
<td width="50%" valign="top">

### 📚 边用边学
- 内置 Markdown 入门教程
- 10 章从零到精通
- 编辑模式语法提示
- 新手友好的交互设计

</td>
</tr>
</table>

## 📸 界面预览

<div align="center">

![Markdown 阅览室 - 首页](docs/screenshots/homepage.png)

*简洁优雅的双栏布局，左侧导航 + 右侧内容区*

</div>

## 🚀 快速开始

### 方式一：直接下载（推荐）

前往 [Releases](https://github.com/leileistart/markdown-viewer-app/releases) 下载最新的 `.exe` 文件，**双击直接运行，无需安装**。

### 方式二：从源码构建

```bash
# 1. 克隆仓库
git clone https://github.com/leileistart/markdown-viewer-app.git
cd markdown-viewer-app

# 2. 安装依赖
npm install

# 3. 启动开发模式
npm run dev          # 纯前端
npm run electron:dev # Electron 桌面应用
npx tauri dev        # Tauri 桌面应用（需要 Rust）
```

### 打包发布

```bash
# Electron 便携版 (~88MB，双击即用)
npm run electron:build

# Tauri 安装包 (~5-8MB，需要 Rust)
npx tauri build
```

> 💡 **国内网络提示**：打包 Electron 时如果超时，请设置镜像源：
> ```powershell
> $env:ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/'
> $env:ELECTRON_BUILDER_BINARIES_MIRROR = 'https://npmmirror.com/mirrors/electron-builder-binaries/'
> ```

## 🎮 功能一览

<table>
<tr>
<th>功能</th>
<th>说明</th>
<th>快捷键</th>
</tr>
<tr><td>📄 打开文件</td><td>选择本地 .md 文件开始阅读</td><td><code>Ctrl + O</code></td></tr>
<tr><td>📁 打开文件夹</td><td>批量导入 Markdown 文件</td><td>—</td></tr>
<tr><td>🔍 搜索</td><td>文件名 + 全文内容实时搜索</td><td><code>Ctrl + F</code></td></tr>
<tr><td>⭐ 收藏</td><td>标记重要文件，置顶显示</td><td>—</td></tr>
<tr><td>🕐 历史</td><td>可视化时间轴阅读轨迹</td><td>—</td></tr>
<tr><td>🏷️ 标签</td><td>智能推荐 + 手动分类管理</td><td>—</td></tr>
<tr><td>✏️ 编辑</td><td>Office 风格工具栏编辑器</td><td>—</td></tr>
<tr><td>📚 教程</td><td>内置 10 章 Markdown 入门教程</td><td>—</td></tr>
<tr><td>🌙 主题</td><td>深色 / 浅色一键切换</td><td>—</td></tr>
<tr><td>🔤 字体</td><td>自由调整阅读字体大小</td><td>—</td></tr>
</table>

### 编辑模式快捷键

<table>
<tr><th>操作</th><th>快捷键</th><th>操作</th><th>快捷键</th></tr>
<tr><td>加粗</td><td><code>Ctrl + B</code></td><td>斜体</td><td><code>Ctrl + I</code></td></tr>
<tr><td>删除线</td><td><code>Ctrl + Shift + X</code></td><td>高亮</td><td><code>Ctrl + Shift + H</code></td></tr>
<tr><td>插入链接</td><td><code>Ctrl + K</code></td><td>保存</td><td><code>Ctrl + S</code></td></tr>
<tr><td>撤销</td><td><code>Ctrl + Z</code></td><td>重做</td><td><code>Ctrl + Shift + Z</code></td></tr>
<tr><td>命令面板</td><td><code>/</code></td><td>返回</td><td><code>Esc</code></td></tr>
</table>

## 🛠️ 技术栈

<table>
<tr><th>层级</th><th>技术</th><th>说明</th></tr>
<tr><td>🎨 前端</td><td>React 19 + TypeScript</td><td>组件化 UI 开发</td></tr>
<tr><td>🎨 样式</td><td>Tailwind CSS 4</td><td>原子化 CSS 框架</td></tr>
<tr><td>📝 Markdown</td><td>markdown-it</td><td>高可扩展 Markdown 解析器</td></tr>
<tr><td>🎨 代码高亮</td><td>highlight.js</td><td>支持 100+ 编程语言</td></tr>
<tr><td>🖥️ 桌面</td><td>Electron / Tauri</td><td>双桌面框架支持</td></tr>
<tr><td>⚡ 构建</td><td>Vite 8</td><td>极速开发体验</td></tr>
</table>

## 📁 项目结构

```
markdown-viewer-app/
├── src/                        # 🎨 React 前端源码
│   ├── App.tsx                 #   主应用组件
│   ├── OfficeEditor.tsx        #   Markdown 编辑器
│   ├── TagManager.tsx          #   标签管理组件
│   └── tutorialData.ts         #   Markdown 教程数据
├── src-tauri/                  # 🦀 Tauri 后端 (Rust)
├── electron.cjs                # ⚡ Electron 主进程
├── vite.config.ts              # 🔧 Vite 构建配置
└── package.json                # 📦 项目配置
```

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！

```bash
# Fork 本仓库
# 创建你的特性分支
git checkout -b feature/amazing-feature

# 提交更改
git commit -m 'feat: add amazing feature'

# 推送到远程
git push origin feature/amazing-feature

# 打开 Pull Request
```

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源许可证。

---

<div align="center">

**如果觉得有用，请给个 ⭐ Star 支持一下！**

Made with ❤️ by [leileistart](https://github.com/leileistart)

</div>
