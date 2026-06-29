import { useState, useRef, useEffect, useCallback } from "react";

interface OfficeEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  fontSize: number;
  fileKey?: string;
}

// 命令面板数据
const commands = [
  { id: "heading1", label: "一级标题", icon: "H1", syntax: "# ", description: "创建一级标题" },
  { id: "heading2", label: "二级标题", icon: "H2", syntax: "## ", description: "创建二级标题" },
  { id: "heading3", label: "三级标题", icon: "H3", syntax: "### ", description: "创建三级标题" },
  { id: "heading4", label: "四级标题", icon: "H4", syntax: "#### ", description: "创建四级标题" },
  { id: "bold", label: "加粗", icon: "B", syntax: "****", description: "加粗文字", wrap: true },
  { id: "italic", label: "斜体", icon: "I", syntax: "**", description: "斜体文字", wrap: true },
  { id: "strikethrough", label: "删除线", icon: "S", syntax: "~~~~", description: "删除线文字", wrap: true },
  { id: "highlight", label: "高亮", icon: "🖍", syntax: "<mark></mark>", description: "高亮文字", wrap: true, innerTag: "mark" },
  { id: "link", label: "链接", icon: "🔗", syntax: "[文字](链接)", description: "插入链接" },
  { id: "image", label: "图片", icon: "🖼", syntax: "![图片描述](图片地址)", description: "插入图片" },
  { id: "code", label: "行内代码", icon: "``", syntax: "``", description: "行内代码", wrap: true },
  { id: "codeblock", label: "代码块", icon: "📋", syntax: "```\n\n```", description: "插入代码块", cursorOffset: 4 },
  { id: "quote", label: "引用", icon: "💬", syntax: "> ", description: "引用块" },
  { id: "ul", label: "无序列表", icon: "•", syntax: "- ", description: "无序列表项" },
  { id: "ol", label: "有序列表", icon: "1.", syntax: "1. ", description: "有序列表项" },
  { id: "task", label: "任务清单", icon: "☑", syntax: "- [ ] ", description: "任务清单" },
  { id: "hr", label: "分割线", icon: "—", syntax: "---\n\n", description: "插入分割线" },
  { id: "table", label: "表格", icon: "📊", syntax: "| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| 内容 | 内容 | 内容 |\n", description: "插入表格" },
  { id: "callout", label: "提示框", icon: "💡", syntax: "> **提示：** ", description: "提示信息" },
];

// 撤销历史配置
const MAX_HISTORY = 300;

export default function OfficeEditor({
  content,
  onChange,
  onSave,
  fontSize,
  fileKey,
}: OfficeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandFilter, setCommandFilter] = useState("");
  const [selectedCommand, setSelectedCommand] = useState(0);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const commandPaletteRef = useRef<HTMLDivElement>(null);

  // 撤销/重做历史
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);
  const prevContentRef = useRef(content);
  const fileKeyRef = useRef(fileKey);

  // 文件切换时重置历史
  useEffect(() => {
    if (fileKey !== fileKeyRef.current) {
      fileKeyRef.current = fileKey;
      prevContentRef.current = content;
      setHistory([content]);
      setHistoryIndex(0);
    }
  }, [content, fileKey]);

  // 初始化历史（首次加载）
  useEffect(() => {
    if (history.length === 0) {
      setHistory([content]);
      setHistoryIndex(0);
    }
  }, []);

  // 记录历史
  const recordHistory = useCallback(
    (newContent: string) => {
      if (isUndoRedoRef.current) {
        isUndoRedoRef.current = false;
        return;
      }
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newContent);
        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
        }
        return newHistory;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
    },
    [historyIndex]
  );

  // 撤销
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  }, [history, historyIndex, onChange]);

  // 重做
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  }, [history, historyIndex, onChange]);

  // 监听内容变化记录历史
  useEffect(() => {
    if (!isUndoRedoRef.current && history.length > 0 && content !== prevContentRef.current) {
      prevContentRef.current = content;
      const timer = setTimeout(() => {
        recordHistory(content);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [content, recordHistory, history.length]);

  // 过滤命令
  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(commandFilter.toLowerCase()) ||
      cmd.description.toLowerCase().includes(commandFilter.toLowerCase())
  );

  // 插入文本到光标位置
  const insertAtCursor = useCallback(
    (text: string, selectStart?: number, selectEnd?: number) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = content.substring(0, start);
      const after = content.substring(end);
      const newContent = before + text + after;

      onChange(newContent);

      setTimeout(() => {
        textarea.focus();
        if (selectStart !== undefined && selectEnd !== undefined) {
          textarea.setSelectionRange(start + selectStart, start + selectEnd);
        } else {
          textarea.setSelectionRange(start + text.length, start + text.length);
        }
      }, 0);
    },
    [content, onChange]
  );

  // 包裹选中文本
  const wrapSelection = useCallback(
    (before: string, after: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);

      if (selectedText) {
        const newContent =
          content.substring(0, start) +
          before +
          selectedText +
          after +
          content.substring(end);
        onChange(newContent);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + before.length, end + before.length);
        }, 0);
      } else {
        insertAtCursor(before + "文字" + after, before.length, before.length + 2);
      }
    },
    [content, onChange, insertAtCursor]
  );

  // 在行首插入
  const insertAtLineStart = useCallback(
    (prefix: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const text = content;
      const lineStart = text.lastIndexOf("\n", start - 1) + 1;
      const before = text.substring(0, lineStart);
      const after = text.substring(lineStart);

      const newContent = before + prefix + after;
      onChange(newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length);
      }, 0);
    },
    [content, onChange]
  );

  // 处理 Tab 键
  const handleTab = useCallback(
    (shiftKey: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const text = content;

      if (shiftKey) {
        const lineStart = text.lastIndexOf("\n", start - 1) + 1;
        if (text.substring(lineStart, start).startsWith("  ")) {
          const newContent = text.substring(0, lineStart) + text.substring(lineStart + 2);
          onChange(newContent);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(Math.max(lineStart, start - 2), Math.max(lineStart, start - 2));
          }, 0);
        }
      } else {
        insertAtCursor("  ");
      }
    },
    [content, onChange, insertAtCursor]
  );

  // 执行命令
  const executeCommand = useCallback(
    (cmd: typeof commands[0]) => {
      setShowCommandPalette(false);
      setCommandFilter("");

      if (cmd.id === "link") {
        setShowLinkDialog(true);
        return;
      }

      if (cmd.wrap) {
        wrapSelection(cmd.syntax, "");
      } else if (cmd.cursorOffset) {
        insertAtCursor(cmd.syntax, cmd.cursorOffset, cmd.cursorOffset);
      } else {
        insertAtCursor(cmd.syntax);
      }
    },
    [insertAtCursor, wrapSelection]
  );

  // 插入链接
  const insertLink = useCallback(() => {
    if (linkText && linkUrl) {
      insertAtCursor(`[${linkText}](${linkUrl})`);
      setShowLinkDialog(false);
      setLinkText("");
      setLinkUrl("");
    }
  }, [linkText, linkUrl, insertAtCursor]);

  // 键盘事件处理
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+B: 加粗
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        wrapSelection("**", "**");
        return;
      }
      // Ctrl+I: 斜体
      if ((e.ctrlKey || e.metaKey) && e.key === "i") {
        e.preventDefault();
        wrapSelection("*", "*");
        return;
      }
      // Ctrl+Shift+X: 删除线
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "X") {
        e.preventDefault();
        wrapSelection("~~", "~~");
        return;
      }
      // Ctrl+Shift+H: 高亮
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "H") {
        e.preventDefault();
        wrapSelection("<mark>", "</mark>");
        return;
      }
      // Ctrl+K: 插入链接
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowLinkDialog(true);
        return;
      }
      // Ctrl+S: 保存
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        onSave();
        return;
      }
      // Ctrl+Z: 撤销
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        undo();
        return;
      }
      // Ctrl+Shift+Z 或 Ctrl+Y: 重做
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "Z") ||
          ((e.ctrlKey || e.metaKey) && e.key === "y")) {
        e.preventDefault();
        redo();
        return;
      }
      // Tab / Shift+Tab: 列表缩进
      if (e.key === "Tab") {
        e.preventDefault();
        handleTab(e.shiftKey);
        return;
      }
      // /: 命令面板（任意位置触发）
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowCommandPalette(true);
        setCommandFilter("");
        setSelectedCommand(0);
        return;
      }
      // Escape: 关闭命令面板
      if (e.key === "Escape") {
        if (showCommandPalette) {
          e.preventDefault();
          setShowCommandPalette(false);
        }
        return;
      }
      // 命令面板导航
      if (showCommandPalette) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedCommand((prev) => Math.min(prev + 1, filteredCommands.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedCommand((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (filteredCommands[selectedCommand]) {
            executeCommand(filteredCommands[selectedCommand]);
          }
        }
      }
    };

    textarea.addEventListener("keydown", handleKeyDown);
    return () => textarea.removeEventListener("keydown", handleKeyDown);
  }, [
    content, wrapSelection, insertAtCursor, handleTab,
    onSave, undo, redo, showCommandPalette, filteredCommands,
    selectedCommand, executeCommand,
  ]);

  // 命令面板过滤变化时重置选中
  useEffect(() => {
    setSelectedCommand(0);
  }, [commandFilter]);

  // 点击外部关闭命令面板
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (commandPaletteRef.current && !commandPaletteRef.current.contains(e.target as Node)) {
        setShowCommandPalette(false);
      }
    };
    if (showCommandPalette) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCommandPalette]);

  // 自动聚焦 textarea
  useEffect(() => {
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  }, []);

  // 工具栏按钮
  const toolbarButtons = [
    { icon: "↩", title: "撤销 (Ctrl+Z)", action: undo, disabled: historyIndex <= 0 },
    { icon: "↪", title: "重做 (Ctrl+Shift+Z)", action: redo, disabled: historyIndex >= history.length - 1 },
    { type: "separator" as const },
    { icon: "B", title: "加粗 (Ctrl+B)", action: () => wrapSelection("**", "**"), bold: true },
    { icon: "I", title: "斜体 (Ctrl+I)", action: () => wrapSelection("*", "*"), italic: true },
    { icon: "S̶", title: "删除线 (Ctrl+Shift+X)", action: () => wrapSelection("~~", "~~") },
    { icon: "🖍", title: "高亮 (Ctrl+Shift+H)", action: () => wrapSelection("<mark>", "</mark>") },
    { type: "separator" as const },
    { icon: "H1", title: "一级标题", action: () => insertAtLineStart("# ") },
    { icon: "H2", title: "二级标题", action: () => insertAtLineStart("## ") },
    { icon: "H3", title: "三级标题", action: () => insertAtLineStart("### ") },
    { type: "separator" as const },
    { icon: "•", title: "无序列表", action: () => insertAtLineStart("- ") },
    { icon: "1.", title: "有序列表", action: () => insertAtLineStart("1. ") },
    { icon: "☑", title: "任务清单", action: () => insertAtLineStart("- [ ] ") },
    { type: "separator" as const },
    { icon: "💬", title: "引用", action: () => insertAtLineStart("> ") },
    { icon: "💻", title: "行内代码", action: () => wrapSelection("`", "`") },
    { icon: "📋", title: "代码块", action: () => insertAtCursor("```\n\n```", 4, 4) },
    { icon: "—", title: "分割线", action: () => insertAtCursor("\n---\n\n") },
    { type: "separator" as const },
    { icon: "🔗", title: "链接 (Ctrl+K)", action: () => setShowLinkDialog(true) },
    { icon: "🖼", title: "图片", action: () => insertAtCursor("![图片描述](图片地址)") },
    { icon: "📊", title: "表格", action: () => insertAtCursor("| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| 内容 | 内容 | 内容 |\n") },
    { type: "separator" as const },
    { icon: "/", title: "命令面板 (/)", action: () => { setShowCommandPalette(true); setCommandFilter(""); } },
  ];

  return (
    <div className="office-editor">
      {/* 工具栏 */}
      <div className="office-toolbar">
        {toolbarButtons.map((btn, index) => {
          if ("type" in btn && btn.type === "separator") {
            return <div key={index} className="toolbar-separator" />;
          }
          const button = btn as { icon: string; title: string; action: () => void; bold?: boolean; italic?: boolean; disabled?: boolean };
          return (
            <button
              key={index}
              className="toolbar-btn"
              title={button.title}
              onClick={button.action}
              disabled={button.disabled}
              style={{
                fontWeight: button.bold ? "bold" : undefined,
                fontStyle: button.italic ? "italic" : undefined,
              }}
            >
              {button.icon}
            </button>
          );
        })}
      </div>

      {/* 编辑器主体 */}
      <div className="office-editor-body">
        <textarea
          ref={textareaRef}
          className="office-textarea"
          value={content}
          onChange={(e) => onChange(e.target.value)}
          style={{ fontSize: `${fontSize}px` }}
          placeholder="开始输入 Markdown 内容...&#10;&#10;按 / 打开命令面板，按 Ctrl+B 加粗，Ctrl+I 斜体"
          spellCheck={false}
        />
      </div>

      {/* 命令面板 */}
      {showCommandPalette && (
        <div className="command-palette" ref={commandPaletteRef}>
          <div className="command-palette-header">
            <input
              type="text"
              className="command-palette-input"
              value={commandFilter}
              onChange={(e) => setCommandFilter(e.target.value)}
              placeholder="输入命令..."
              autoFocus
            />
          </div>
          <div className="command-palette-list">
            {filteredCommands.map((cmd, index) => (
              <div
                key={cmd.id}
                className={`command-palette-item ${selectedCommand === index ? "selected" : ""}`}
                onClick={() => executeCommand(cmd)}
                onMouseEnter={() => setSelectedCommand(index)}
              >
                <span className="command-icon">{cmd.icon}</span>
                <div className="command-info">
                  <span className="command-label">{cmd.label}</span>
                  <span className="command-desc">{cmd.description}</span>
                </div>
                <span className="command-syntax">{cmd.syntax.replace(/\n/g, " ")}</span>
              </div>
            ))}
            {filteredCommands.length === 0 && (
              <div className="command-palette-empty">没有匹配的命令</div>
            )}
          </div>
        </div>
      )}

      {/* 链接对话框 */}
      {showLinkDialog && (
        <div className="modal-overlay" onClick={() => setShowLinkDialog(false)}>
          <div className="modal-content" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔗 插入链接</h3>
              <button className="modal-close" onClick={() => setShowLinkDialog(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", color: "var(--text-secondary)" }}>链接文字</label>
                  <input
                    type="text"
                    className="command-palette-input"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="显示的文字"
                    autoFocus
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", color: "var(--text-secondary)" }}>链接地址</label>
                  <input
                    type="url"
                    className="command-palette-input"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button className="btn-secondary" onClick={() => setShowLinkDialog(false)}>取消</button>
                  <button className="btn-primary" onClick={insertLink}>插入</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 状态栏 */}
      <div className="office-statusbar">
        <span>编辑模式</span>
        <span className="statusbar-hint">按 / 打开命令面板 · 撤销 {historyIndex + 1}/{history.length}</span>
        <span>{content.length} 字符</span>
      </div>
    </div>
  );
}
