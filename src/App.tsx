import { useState, useEffect, useMemo, useRef } from "react";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import "./App.css";
import { tutorialChapters } from "./tutorialData";
import OfficeEditor from "./OfficeEditor";
import TagManager from "./TagManager";
import type { Tag, FileTags } from "./TagManager";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (_) {}
    }
    return "";
  },
});

interface FileItem {
  name: string;
  content: string;
}

interface HistoryItem {
  name: string;
  timestamp: number;
  readCount: number;
}

function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [tags, setTags] = useState<Tag[]>(() => {
    const saved = localStorage.getItem("tags");
    return saved ? JSON.parse(saved) : [
      { id: "1", name: "工作", color: "#3b82f6" },
      { id: "2", name: "个人", color: "#10b981" },
      { id: "3", name: "重要", color: "#f59e0b" },
    ];
  });
  const [fileTags, setFileTags] = useState<FileTags>(() => {
    const saved = localStorage.getItem("fileTags");
    return saved ? JSON.parse(saved) : {};
  });
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [showTagAssigner, setShowTagAssigner] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("fontSize");
    return saved ? parseInt(saved) : 16;
  });
  const [editMode, setEditMode] = useState<"read" | "edit">("read");
  const [editContent, setEditContent] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialChapter, setTutorialChapter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // 学习功能设置
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("settings");
    return saved
      ? JSON.parse(saved)
      : {
          showPreview: true,
          syntaxHighlight: true,
          autoSuggest: true,
          showTutorial: true,
        };
  });

  // 主题切换
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  // 保存收藏状态
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify([...favorites]));
  }, [favorites]);

  // 保存标签
  useEffect(() => {
    localStorage.setItem("tags", JSON.stringify(tags));
  }, [tags]);

  // 保存文件标签
  useEffect(() => {
    localStorage.setItem("fileTags", JSON.stringify(fileTags));
  }, [fileTags]);

  // 保存设置
  useEffect(() => {
    localStorage.setItem("settings", JSON.stringify(settings));
  }, [settings]);

  // 保存字体大小
  useEffect(() => {
    localStorage.setItem("fontSize", fontSize.toString());
  }, [fontSize]);

  // 保存历史记录
  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  // 初始化历史记录
  useEffect(() => {
    const saved = localStorage.getItem("history");
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  // 打开单个文件
  const handleOpenFile = () => {
    fileInputRef.current?.click();
  };

  // 打开文件夹
  const handleOpenFolder = () => {
    folderInputRef.current?.click();
  };

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    const newFiles: FileItem[] = [];
    let loadedCount = 0;
    const totalFiles = Array.from(fileList).filter(
      (f) => f.name.endsWith(".md") || f.name.endsWith(".markdown")
    ).length;

    Array.from(fileList).forEach((file) => {
      if (file.name.endsWith(".md") || file.name.endsWith(".markdown")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          newFiles.push({ name: file.name, content });
          loadedCount++;

          if (loadedCount === totalFiles) {
            setFiles((prev) => {
              const existingNames = new Set(prev.map((f) => f.name));
              const uniqueNewFiles = newFiles.filter(
                (f) => !existingNames.has(f.name)
              );
              return [...prev, ...uniqueNewFiles];
            });
            setCurrentPage("files");
          }
        };
        reader.readAsText(file);
      }
    });

    // 重置 input
    e.target.value = "";
  };

  // 搜索过滤 + 标签过滤
  const filteredFiles = useMemo(() => {
    let result = files;

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          f.content.toLowerCase().includes(query)
      );
    }

    // 标签过滤
    if (activeTagFilter) {
      result = result.filter((f) => {
        const fileTagIds = fileTags[f.name] || [];
        return fileTagIds.includes(activeTagFilter);
      });
    }

    return result;
  }, [files, searchQuery, activeTagFilter, fileTags]);

  // 打开文件
  const openFile = (fileName: string) => {
    setSelectedFile(fileName);
    setCurrentPage("reader");
    setEditMode("read");
    setEditContent(files.find((f) => f.name === fileName)?.content || "");

    // 更新历史记录
    setHistory((prev) => {
      const existing = prev.find((h) => h.name === fileName);
      if (existing) {
        return prev.map((h) =>
          h.name === fileName
            ? { ...h, timestamp: Date.now(), readCount: h.readCount + 1 }
            : h
        );
      }
      return [
        { name: fileName, timestamp: Date.now(), readCount: 1 },
        ...prev,
      ].slice(0, 50);
    });
  };

  // 删除文件
  const removeFile = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
    if (selectedFile === fileName) {
      setSelectedFile(null);
      setCurrentPage("files");
    }
  };

  // 切换收藏状态
  const toggleFavorite = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(fileName)) {
        newFavorites.delete(fileName);
      } else {
        newFavorites.add(fileName);
      }
      return newFavorites;
    });
  };

  // 检查是否已收藏
  const isFavorite = (fileName: string) => {
    return favorites.has(fileName);
  };

  // 渲染 Markdown
  const renderMarkdown = (content: string) => {
    return md.render(content);
  };

  // 获取收藏文件
  const favoriteFiles = files.filter((f) => isFavorite(f.name));

  // 获取历史文件（按时间排序）
  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => b.timestamp - a.timestamp);
  }, [history]);

  // 切换设置
  const toggleSetting = (key: string) => {
    setSettings((prev: any) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 保存编辑内容
  const saveEdit = () => {
    if (selectedFile) {
      setFiles((prev) =>
        prev.map((f) => (f.name === selectedFile ? { ...f, content: editContent } : f))
      );
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    return new Date(timestamp).toLocaleDateString("zh-CN");
  };

  // 按日期分组历史记录
  const groupHistoryByDate = useMemo(() => {
    const groups: { [key: string]: HistoryItem[] } = {};
    const now = new Date();

    sortedHistory.forEach((item) => {
      const date = new Date(item.timestamp);
      const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

      let key: string;
      if (diffDays === 0) key = "今天";
      else if (diffDays === 1) key = "昨天";
      else if (diffDays < 7) key = "本周";
      else if (diffDays < 30) key = "本月";
      else key = "更早";

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return groups;
  }, [sortedHistory]);

  // 快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "o":
            e.preventDefault();
            handleOpenFile();
            break;
          case "f":
            e.preventDefault();
            document.querySelector<HTMLInputElement>(".search-input")?.focus();
            break;
          case ",":
            e.preventDefault();
            setCurrentPage("settings");
            break;
          case "1":
            e.preventDefault();
            setCurrentPage("home");
            break;
          case "2":
            e.preventDefault();
            setCurrentPage("files");
            break;
          case "3":
            e.preventDefault();
            setCurrentPage("history");
            break;
          case "4":
            e.preventDefault();
            setCurrentPage("favorites");
            break;
          case "s":
            if (editMode !== "read") {
              e.preventDefault();
              saveEdit();
            }
            break;
        }
      }
      if (e.key === "Escape") {
        if (showTutorial) {
          setShowTutorial(false);
        } else if (currentPage === "reader" && editMode === "read") {
          setCurrentPage("files");
        } else if (currentPage === "reader" && editMode === "edit") {
          setEditMode("read");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, editMode, showTutorial]);

  return (
    <div className="app">
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown"
        multiple
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory=""
        multiple
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* 教程弹窗 */}
      {showTutorial && (
        <div className="modal-overlay" onClick={() => setShowTutorial(false)}>
          <div className="modal-content tutorial-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📚 Markdown 学习教程</h3>
              <button className="modal-close" onClick={() => setShowTutorial(false)}>
                ×
              </button>
            </div>
            <div className="tutorial-layout">
              {/* 左侧章节列表 */}
              <div className="tutorial-sidebar">
                {tutorialChapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    className={`tutorial-chapter-btn ${tutorialChapter === index ? "active" : ""}`}
                    onClick={() => setTutorialChapter(index)}
                  >
                    <span className="chapter-icon">{chapter.icon}</span>
                    <span className="chapter-title">{chapter.title}</span>
                  </button>
                ))}
              </div>
              {/* 右侧内容区 */}
              <div className="tutorial-content">
                <div className="tutorial-chapter-header">
                  <span className="chapter-icon-large">
                    {tutorialChapters[tutorialChapter].icon}
                  </span>
                  <div>
                    <h4>{tutorialChapters[tutorialChapter].title}</h4>
                    <p>{tutorialChapters[tutorialChapter].description}</p>
                  </div>
                </div>
                <div className="tutorial-chapter-body">
                  <div
                    className="markdown-content"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(tutorialChapters[tutorialChapter].content),
                    }}
                  />
                </div>
                <div className="tutorial-navigation">
                  <button
                    className="btn-secondary"
                    onClick={() => setTutorialChapter(Math.max(0, tutorialChapter - 1))}
                    disabled={tutorialChapter === 0}
                  >
                    ← 上一章
                  </button>
                  <span className="chapter-indicator">
                    {tutorialChapter + 1} / {tutorialChapters.length}
                  </span>
                  <button
                    className="btn-primary"
                    onClick={() =>
                      setTutorialChapter(
                        Math.min(tutorialChapters.length - 1, tutorialChapter + 1)
                      )
                    }
                    disabled={tutorialChapter === tutorialChapters.length - 1}
                  >
                    下一章 →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 顶部标题栏 */}
      <header className="header">
        <div className="header-left">
          <span className="logo">📝</span>
          <span className="title">Markdown 阅览室</span>
        </div>
        <div className="header-right">
          {currentPage === "reader" && selectedFile && (
            <button
              className="btn-secondary"
              onClick={() => setCurrentPage("files")}
            >
              ← 返回 (Esc)
            </button>
          )}
          <button
            className="theme-toggle"
            onClick={() => setIsDark(!isDark)}
            title={isDark ? "切换到浅色模式" : "切换到深色模式"}
          >
            {isDark ? "☀️" : "🌙"}
          </button>
          <button
            className="settings-btn"
            onClick={() => setCurrentPage("settings")}
            title="设置 (Ctrl+,)"
          >
            ⚙️
          </button>
        </div>
      </header>

      <div className="main-container">
        {/* 侧边栏 */}
        <aside className="sidebar">
          {/* 搜索框 */}
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 搜索文件... (Ctrl+F)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* 快捷操作 */}
          <div className="quick-actions">
            <button className="action-btn" onClick={handleOpenFile}>
              📄 打开文件
            </button>
            <button className="action-btn" onClick={handleOpenFolder}>
              📁 打开文件夹
            </button>
          </div>

          {/* 导航菜单 */}
          <nav className="nav-menu">
            <button
              className={`nav-item ${currentPage === "home" ? "active" : ""}`}
              onClick={() => setCurrentPage("home")}
            >
              <span>🏠</span>
              <span>首页</span>
            </button>
            <button
              className={`nav-item ${currentPage === "files" ? "active" : ""}`}
              onClick={() => setCurrentPage("files")}
            >
              <span>📁</span>
              <span>文件</span>
              {files.length > 0 && (
                <span className="badge">{files.length}</span>
              )}
            </button>
            <button
              className={`nav-item ${currentPage === "history" ? "active" : ""}`}
              onClick={() => setCurrentPage("history")}
            >
              <span>🕐</span>
              <span>历史</span>
              {history.length > 0 && (
                <span className="badge">{history.length}</span>
              )}
            </button>
            <button
              className={`nav-item ${currentPage === "favorites" ? "active" : ""}`}
              onClick={() => setCurrentPage("favorites")}
            >
              <span>⭐</span>
              <span>收藏</span>
              {favoriteFiles.length > 0 && (
                <span className="badge">{favoriteFiles.length}</span>
              )}
            </button>
          </nav>

          {/* 学习助手按钮 */}
          {settings.showTutorial && (
            <button className="tutorial-btn" onClick={() => setShowTutorial(true)}>
              📚 学习 Markdown
            </button>
          )}

          {/* 文件列表 */}
          {currentPage === "files" && files.length > 0 && (
            <div className="file-tree">
              <div className="file-tree-title">文件列表</div>
              <div className="file-tree-content">
                {filteredFiles.map((file) => (
                  <button
                    key={file.name}
                    className={`file-item ${selectedFile === file.name ? "selected" : ""}`}
                    onClick={() => openFile(file.name)}
                  >
                    <span>📄</span>
                    <span className="file-name">{file.name}</span>
                    <span
                      className={`favorite-btn ${isFavorite(file.name) ? "active" : ""}`}
                      onClick={(e) => toggleFavorite(file.name, e)}
                    >
                      {isFavorite(file.name) ? "⭐" : "☆"}
                    </span>
                    <span
                      className="remove-btn"
                      onClick={(e) => removeFile(file.name, e)}
                      title="移除"
                    >
                      ×
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 标签系统 */}
          <TagManager
            tags={tags}
            fileTags={fileTags}
            files={files}
            onTagsChange={setTags}
            onFileTagsChange={setFileTags}
            onFilterByTag={setActiveTagFilter}
            activeTagFilter={activeTagFilter}
            showTagAssigner={showTagAssigner}
            onShowTagAssigner={setShowTagAssigner}
          />
        </aside>

        {/* 主内容区 */}
        <main className="content">
          {/* 首页 */}
          {currentPage === "home" && (
            <>
              <h2 className="page-title">欢迎回来 👋</h2>
              <p className="page-subtitle">
                这是你的 Markdown 阅览室，专注于阅读和管理 Markdown 文件。
              </p>

              {/* 快速打开 */}
              <div className="cards-grid">
                <div className="card">
                  <h3 className="card-title">📄 打开文件</h3>
                  <p className="card-desc">
                    选择本地 Markdown 文件开始阅读
                  </p>
                  <button className="btn-primary" onClick={handleOpenFile}>
                    选择文件 (Ctrl+O)
                  </button>
                </div>

                <div className="card">
                  <h3 className="card-title">📁 打开文件夹</h3>
                  <p className="card-desc">
                    选择文件夹，批量导入 Markdown 文件
                  </p>
                  <button className="btn-primary" onClick={handleOpenFolder}>
                    选择文件夹
                  </button>
                </div>
              </div>

              {/* 最近打开和收藏 */}
              <div className="cards-grid" style={{ marginTop: "16px" }}>
                <div className="card">
                  <h3 className="card-title">🕐 最近打开</h3>
                  <div className="card-list">
                    {sortedHistory.length > 0 ? (
                      sortedHistory.slice(0, 3).map((item) => (
                        <div
                          key={item.name}
                          className="card-item clickable"
                          onClick={() => openFile(item.name)}
                        >
                          <span>📄 {item.name}</span>
                          <span className="item-time">{formatTime(item.timestamp)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="empty-hint">暂无历史记录</div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <h3 className="card-title">⭐ 收藏文件</h3>
                  <div className="card-list">
                    {favoriteFiles.length > 0 ? (
                      favoriteFiles.slice(0, 3).map((file) => (
                        <div
                          key={file.name}
                          className="card-item clickable"
                          onClick={() => openFile(file.name)}
                        >
                          <span>📄 {file.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="empty-hint">暂无收藏文件</div>
                    )}
                  </div>
                </div>
              </div>

              {/* 学习入口 */}
              {settings.showTutorial && (
                <div className="card" style={{ marginTop: "16px" }}>
                  <h3 className="card-title">📚 学习 Markdown</h3>
                  <p className="card-desc">
                    新手？点击这里学习 Markdown 基础语法
                  </p>
                  <button className="btn-primary" onClick={() => setShowTutorial(true)}>
                    开始学习
                  </button>
                </div>
              )}

              {/* 统计 */}
              {files.length > 0 && (
                <div className="stats-row">
                  <div className="stat-card">
                    <div className="stat-number">{files.length}</div>
                    <div className="stat-label">已加载文件</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{favoriteFiles.length}</div>
                    <div className="stat-label">收藏文件</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{history.length}</div>
                    <div className="stat-label">阅读记录</div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 文件列表 */}
          {currentPage === "files" && (
            <>
              <h2 className="page-title">📁 文件管理</h2>
              {files.length === 0 ? (
                <div className="empty-state">
                  <p>还没有打开任何文件</p>
                  <div className="empty-actions">
                    <button className="btn-primary" onClick={handleOpenFile}>
                      📄 打开文件 (Ctrl+O)
                    </button>
                    <button className="btn-primary" onClick={handleOpenFolder}>
                      📁 打开文件夹
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="page-subtitle">
                    共 {filteredFiles.length} 个文件
                    {searchQuery && ` (搜索: "${searchQuery}")`}
                  </p>
                  <div className="file-grid">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.name}
                        className="file-card"
                        onClick={() => openFile(file.name)}
                      >
                        <div className="file-card-header">
                          <span>📄</span>
                          <div className="file-card-actions">
                            <span
                              className="tag-btn"
                              onClick={(e) => { e.stopPropagation(); setShowTagAssigner(file.name); }}
                              title="添加标签"
                            >
                              🏷
                            </span>
                            <span
                              className={`favorite-btn ${isFavorite(file.name) ? "active" : ""}`}
                              onClick={(e) => toggleFavorite(file.name, e)}
                            >
                              {isFavorite(file.name) ? "⭐" : "☆"}
                            </span>
                            <span
                              className="remove-btn"
                              onClick={(e) => removeFile(file.name, e)}
                              title="移除"
                            >
                              ×
                            </span>
                          </div>
                        </div>
                        <div className="file-card-name">{file.name}</div>
                        <div className="file-card-tags">
                          {(fileTags[file.name] || []).map((tagId) => {
                            const tag = tags.find((t) => t.id === tagId);
                            return tag ? (
                              <span
                                key={tagId}
                                className="file-tag"
                                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                        <div className="file-card-preview">
                          {file.content.substring(0, 100)}...
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* 阅读器/编辑器 */}
          {currentPage === "reader" && selectedFile && (
            <div className="reader">
              <div className="reader-header">
                <h2 className="page-title">{selectedFile}</h2>
                <div className="reader-actions">
                  {/* 编辑模式切换 */}
                  <div className="edit-mode-switch">
                    <button
                      className={`mode-btn ${editMode === "read" ? "active" : ""}`}
                      onClick={() => setEditMode("read")}
                    >
                      👁 阅读
                    </button>
                    <button
                      className={`mode-btn ${editMode === "edit" ? "active" : ""}`}
                      onClick={() => setEditMode("edit")}
                    >
                      ✏️ 编辑
                    </button>
                  </div>

                  <div className="font-size-control">
                    <button
                      className="btn-icon"
                      onClick={() => setFontSize((prev) => Math.max(12, prev - 2))}
                      title="减小字体"
                    >
                      A-
                    </button>
                    <span className="font-size-label">{fontSize}px</span>
                    <button
                      className="btn-icon"
                      onClick={() => setFontSize((prev) => Math.min(24, prev + 2))}
                      title="增大字体"
                    >
                      A+
                    </button>
                  </div>

                  <span
                    className={`favorite-btn large ${isFavorite(selectedFile) ? "active" : ""}`}
                    onClick={() =>
                      toggleFavorite(selectedFile, {
                        stopPropagation: () => {},
                      } as React.MouseEvent)
                    }
                  >
                    {isFavorite(selectedFile) ? "⭐ 已收藏" : "☆ 收藏"}
                  </span>
                </div>
              </div>

              {/* 编辑模式提示 */}
              {editMode === "edit" && settings.showTutorial && (
                <div className="edit-hint office-hint">
                  <span>💡 编辑模式：使用工具栏或快捷键（Ctrl+B 加粗、Ctrl+I 斜体、/ 命令面板）</span>
                  <button className="hint-link" onClick={() => setShowTutorial(true)}>
                    查看教程
                  </button>
                </div>
              )}

              {/* 内容区域 */}
              {editMode === "read" ? (
                <div
                  className="markdown-content"
                  style={{ fontSize: `${fontSize}px` }}
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(editContent),
                  }}
                />
              ) : (
                <OfficeEditor
                  content={editContent}
                  onChange={setEditContent}
                  onSave={saveEdit}
                  fontSize={fontSize}
                  fileKey={selectedFile || ""}
                />
              )}
            </div>
          )}

          {/* 历史记录 - 可视化时间轴 */}
          {currentPage === "history" && (
            <>
              <h2 className="page-title">🕐 阅读历史</h2>
              <p className="page-subtitle">查看你的阅读轨迹</p>
              {sortedHistory.length > 0 ? (
                <div className="timeline">
                  {Object.entries(groupHistoryByDate).map(([dateLabel, items]) => (
                    <div key={dateLabel} className="timeline-group">
                      <div className="timeline-date">
                        <span className="timeline-dot"></span>
                        <span className="timeline-label">{dateLabel}</span>
                      </div>
                      <div className="timeline-items">
                        {items.map((item) => (
                          <div
                            key={item.name}
                            className="timeline-item"
                            onClick={() => openFile(item.name)}
                          >
                            <div className="timeline-item-content">
                              <span className="timeline-item-name">📄 {item.name}</span>
                              <span className="timeline-item-time">
                                {formatTime(item.timestamp)}
                              </span>
                            </div>
                            <div className="timeline-item-stats">
                              <span className="stat-badge">阅读 {item.readCount} 次</span>
                              <span
                                className={`favorite-btn ${isFavorite(item.name) ? "active" : ""}`}
                                onClick={(e) => toggleFavorite(item.name, e)}
                              >
                                {isFavorite(item.name) ? "⭐" : "☆"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>暂无阅读记录</p>
                  <p className="hint">打开文件后会自动记录</p>
                </div>
              )}
            </>
          )}

          {/* 收藏文件 */}
          {currentPage === "favorites" && (
            <>
              <h2 className="page-title">⭐ 收藏文件</h2>
              <p className="page-subtitle">你收藏的重要文件</p>
              {favoriteFiles.length > 0 ? (
                <div className="file-grid">
                  {favoriteFiles.map((file) => (
                    <div
                      key={file.name}
                      className="file-card"
                      onClick={() => openFile(file.name)}
                    >
                      <div className="file-card-header">
                        <span>📄</span>
                        <span
                          className="favorite-btn active"
                          onClick={(e) => toggleFavorite(file.name, e)}
                        >
                          ⭐
                        </span>
                      </div>
                      <div className="file-card-name">{file.name}</div>
                      <div className="file-card-preview">
                        {file.content.substring(0, 100)}...
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>暂无收藏文件</p>
                  <p className="hint">点击文件旁的 ☆ 可添加收藏</p>
                </div>
              )}
            </>
          )}

          {/* 设置页面 */}
          {currentPage === "settings" && (
            <>
              <h2 className="page-title">⚙️ 设置</h2>
              <div className="settings-section">
                <h3 className="settings-title">外观</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">深色模式</span>
                    <span className="setting-desc">切换浅色/深色主题</span>
                  </div>
                  <button
                    className={`toggle-btn ${isDark ? "active" : ""}`}
                    onClick={() => setIsDark(!isDark)}
                  >
                    {isDark ? "🌙 开启" : "☀️ 关闭"}
                  </button>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">默认字体大小</span>
                    <span className="setting-desc">调整 Markdown 渲染的字体大小</span>
                  </div>
                  <div className="font-size-control">
                    <button className="btn-icon" onClick={() => setFontSize((prev) => Math.max(12, prev - 2))}>A-</button>
                    <span className="font-size-label">{fontSize}px</span>
                    <button className="btn-icon" onClick={() => setFontSize((prev) => Math.min(24, prev + 2))}>A+</button>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3 className="settings-title">学习助手</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">实时预览对照</span>
                    <span className="setting-desc">编辑时左右分栏显示源码和预览</span>
                  </div>
                  <button
                    className={`toggle-btn ${settings.showPreview ? "active" : ""}`}
                    onClick={() => toggleSetting("showPreview")}
                  >
                    {settings.showPreview ? "✓ 开启" : "× 关闭"}
                  </button>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">语法高亮提示</span>
                    <span className="setting-desc">不同 Markdown 语法用不同颜色显示</span>
                  </div>
                  <button
                    className={`toggle-btn ${settings.syntaxHighlight ? "active" : ""}`}
                    onClick={() => toggleSetting("syntaxHighlight")}
                  >
                    {settings.syntaxHighlight ? "✓ 开启" : "× 关闭"}
                  </button>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">编辑提示</span>
                    <span className="setting-desc">编辑时显示 Markdown 语法提示</span>
                  </div>
                  <button
                    className={`toggle-btn ${settings.autoSuggest ? "active" : ""}`}
                    onClick={() => toggleSetting("autoSuggest")}
                  >
                    {settings.autoSuggest ? "✓ 开启" : "× 关闭"}
                  </button>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">教程入口</span>
                    <span className="setting-desc">显示 Markdown 学习教程入口</span>
                  </div>
                  <button
                    className={`toggle-btn ${settings.showTutorial ? "active" : ""}`}
                    onClick={() => toggleSetting("showTutorial")}
                  >
                    {settings.showTutorial ? "✓ 开启" : "× 关闭"}
                  </button>
                </div>
              </div>

              <div className="settings-section">
                <h3 className="settings-title">全局快捷键</h3>
                <div className="shortcut-list">
                  <div className="shortcut-item"><span>打开文件</span><kbd>Ctrl + O</kbd></div>
                  <div className="shortcut-item"><span>搜索</span><kbd>Ctrl + F</kbd></div>
                  <div className="shortcut-item"><span>设置</span><kbd>Ctrl + ,</kbd></div>
                  <div className="shortcut-item"><span>首页</span><kbd>Ctrl + 1</kbd></div>
                  <div className="shortcut-item"><span>文件</span><kbd>Ctrl + 2</kbd></div>
                  <div className="shortcut-item"><span>历史</span><kbd>Ctrl + 3</kbd></div>
                  <div className="shortcut-item"><span>收藏</span><kbd>Ctrl + 4</kbd></div>
                  <div className="shortcut-item"><span>返回/关闭</span><kbd>Esc</kbd></div>
                </div>
              </div>

              <div className="settings-section">
                <h3 className="settings-title">编辑模式快捷键</h3>
                <div className="shortcut-list">
                  <div className="shortcut-item"><span>加粗</span><kbd>Ctrl + B</kbd></div>
                  <div className="shortcut-item"><span>斜体</span><kbd>Ctrl + I</kbd></div>
                  <div className="shortcut-item"><span>删除线</span><kbd>Ctrl + Shift + X</kbd></div>
                  <div className="shortcut-item"><span>高亮</span><kbd>Ctrl + Shift + H</kbd></div>
                  <div className="shortcut-item"><span>插入链接</span><kbd>Ctrl + K</kbd></div>
                  <div className="shortcut-item"><span>保存</span><kbd>Ctrl + S</kbd></div>
                  <div className="shortcut-item"><span>撤销</span><kbd>Ctrl + Z</kbd></div>
                  <div className="shortcut-item"><span>重做</span><kbd>Ctrl + Shift + Z</kbd></div>
                  <div className="shortcut-item"><span>缩进</span><kbd>Tab</kbd></div>
                  <div className="shortcut-item"><span>减少缩进</span><kbd>Shift + Tab</kbd></div>
                  <div className="shortcut-item"><span>命令面板</span><kbd>/</kbd></div>
                </div>
              </div>

              <div className="settings-section">
                <h3 className="settings-title">数据</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">清除历史记录</span>
                    <span className="setting-desc">删除所有阅读历史</span>
                  </div>
                  <button className="btn-danger" onClick={() => setHistory([])}>清除</button>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">清除收藏</span>
                    <span className="setting-desc">取消所有收藏</span>
                  </div>
                  <button className="btn-danger" onClick={() => setFavorites(new Set())}>清除</button>
                </div>
              </div>

              <div className="settings-section">
                <h3 className="settings-title">关于</h3>
                <div className="about-info">
                  <p><strong>Markdown 阅览室</strong> v0.2.0</p>
                  <p>轻量、美观、智能的 Markdown 文件浏览器</p>
                  <p>阅读为主 · 编辑为辅 · 学习友好</p>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
