import { useState, useEffect, useCallback } from "react";

// 标签类型定义
export interface Tag {
  id: string;
  name: string;
  color: string;
}

// 文件标签映射
export interface FileTags {
  [fileName: string]: string[];
}

// 智能推荐的标签规则
const TAG_RULES: { tag: string; keywords: string[]; color: string }[] = [
  { tag: "工作", keywords: ["周报", "汇报", "项目", "任务", "会议", "需求", "进度", "开发", "上线", "发布"], color: "#3b82f6" },
  { tag: "个人", keywords: ["笔记", "日记", "生活", "学习", "读书", "感悟", "想法", "计划"], color: "#10b981" },
  { tag: "重要", keywords: ["重要", "紧急", "必须", "关键", "核心", "注意", "警告"], color: "#f59e0b" },
  { tag: "技术", keywords: ["代码", "程序", "API", "数据库", "前端", "后端", "架构", "算法", "bug", "修复", "部署"], color: "#8b5cf6" },
  { tag: "学习", keywords: ["教程", "学习", "课程", "笔记", "知识", "概念", "原理", "入门"], color: "#ec4899" },
  { tag: "会议", keywords: ["会议", "讨论", "参会", "议题", "纪要", "决策"], color: "#06b6d4" },
  { tag: "待办", keywords: ["待办", "TODO", "计划", "下一步", "安排", "任务清单"], color: "#f97316" },
  { tag: "总结", keywords: ["总结", "复盘", "回顾", "分析", "报告", "汇报"], color: "#14b8a6" },
  { tag: "文档", keywords: ["文档", "说明", "规范", "指南", "手册", "README"], color: "#6366f1" },
  { tag: "草稿", keywords: ["草稿", "初稿", "想法", "灵感", "构思", "brainstorm"], color: "#9ca3af" },
];

// 预设颜色
const PRESET_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899",
  "#06b6d4", "#f97316", "#14b8a6", "#6366f1", "#ef4444",
  "#84cc16", "#a855f7", "#22d3ee", "#fb923c", "#4ade80",
];

interface TagManagerProps {
  tags: Tag[];
  fileTags: FileTags;
  files: { name: string; content: string }[];
  onTagsChange: (tags: Tag[]) => void;
  onFileTagsChange: (fileTags: FileTags) => void;
  onFilterByTag: (tagId: string | null) => void;
  activeTagFilter: string | null;
  showTagAssigner: string | null;
  onShowTagAssigner: (fileName: string | null) => void;
}

export default function TagManager({
  tags,
  fileTags,
  files,
  onTagsChange,
  onFileTagsChange,
  onFilterByTag,
  activeTagFilter,
  showTagAssigner,
  onShowTagAssigner,
}: TagManagerProps) {
  const [showTagManager, setShowTagManager] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const [suggestions, setSuggestions] = useState<{ fileName: string; tags: string[] }[]>([]);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [editTagColor, setEditTagColor] = useState("");

  // 智能推荐标签
  const generateSuggestions = useCallback(() => {
    const newSuggestions: { fileName: string; tags: string[] }[] = [];

    files.forEach((file) => {
      const existingTags = fileTags[file.name] || [];
      const contentLower = file.content.toLowerCase();
      const recommended: string[] = [];

      TAG_RULES.forEach((rule) => {
        if (!existingTags.includes(rule.tag)) {
          const matchCount = rule.keywords.filter((kw) =>
            contentLower.includes(kw.toLowerCase())
          ).length;
          if (matchCount >= 2) {
            recommended.push(rule.tag);
          }
        }
      });

      if (recommended.length > 0) {
        newSuggestions.push({ fileName: file.name, tags: recommended.slice(0, 3) });
      }
    });

    setSuggestions(newSuggestions);
  }, [files, fileTags]);

  // 文件加载时生成推荐
  useEffect(() => {
    if (files.length > 0) {
      generateSuggestions();
    }
  }, [files, generateSuggestions]);

  // 添加新标签
  const addTag = () => {
    if (newTagName.trim()) {
      const newTag: Tag = {
        id: Date.now().toString(),
        name: newTagName.trim(),
        color: newTagColor,
      };
      onTagsChange([...tags, newTag]);
      setNewTagName("");
      setNewTagColor(PRESET_COLORS[0]);
    }
  };

  // 删除标签
  const deleteTag = (tagId: string) => {
    onTagsChange(tags.filter((t) => t.id !== tagId));
    // 同时从所有文件中移除该标签
    const newFileTags = { ...fileTags };
    Object.keys(newFileTags).forEach((fileName) => {
      newFileTags[fileName] = newFileTags[fileName].filter((t) => t !== tagId);
    });
    onFileTagsChange(newFileTags);
  };

  // 开始编辑标签
  const startEditTag = (tag: Tag) => {
    setEditingTag(tag.id);
    setEditTagName(tag.name);
    setEditTagColor(tag.color);
  };

  // 保存编辑
  const saveEditTag = () => {
    if (editingTag && editTagName.trim()) {
      onTagsChange(
        tags.map((t) =>
          t.id === editingTag
            ? { ...t, name: editTagName.trim(), color: editTagColor }
            : t
        )
      );
      setEditingTag(null);
      setEditTagName("");
      setEditTagColor("");
    }
  };

  // 取消编辑
  const cancelEditTag = () => {
    setEditingTag(null);
    setEditTagName("");
    setEditTagColor("");
  };

  // 切换文件的标签
  const toggleFileTag = (fileName: string, tagId: string) => {
    const currentTags = fileTags[fileName] || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter((t) => t !== tagId)
      : [...currentTags, tagId];

    onFileTagsChange({
      ...fileTags,
      [fileName]: newTags,
    });
  };

  // 应用推荐标签
  const applySuggestion = (fileName: string, tagNames: string[]) => {
    const tagIds = tagNames
      .map((name) => tags.find((t) => t.name === name)?.id)
      .filter(Boolean) as string[];

    const currentTags = fileTags[fileName] || [];
    const newTags = [...new Set([...currentTags, ...tagIds])];

    onFileTagsChange({
      ...fileTags,
      [fileName]: newTags,
    });

    // 移除已应用的推荐
    setSuggestions((prev) => prev.filter((s) => s.fileName !== fileName));
  };

  // 获取标签名称
  const getTagName = (tagId: string) => tags.find((t) => t.id === tagId)?.name || "";
  const getTagColor = (tagId: string) => tags.find((t) => t.id === tagId)?.color || "#9ca3af";

  return (
    <>
      {/* 侧边栏标签区域 */}
      <div className="tags-section">
        <div className="tags-header">
          <span className="tags-title">标签</span>
          <button className="tags-manage-btn" onClick={() => setShowTagManager(true)} title="管理标签">
            ⚙
          </button>
        </div>
        <div className="tags-container">
          {tags.map((tag) => (
            <button
              key={tag.id}
              className={`tag ${activeTagFilter === tag.id ? "active" : ""}`}
              style={{
                backgroundColor: `${tag.color}20`,
                color: tag.color,
                borderColor: activeTagFilter === tag.id ? tag.color : "transparent",
              }}
              onClick={() => onFilterByTag(activeTagFilter === tag.id ? null : tag.id)}
            >
              {tag.name}
            </button>
          ))}
          {tags.length === 0 && (
            <span className="tags-empty">暂无标签</span>
          )}
        </div>
      </div>

      {/* 智能推荐 */}
      {suggestions.length > 0 && (
        <div className="tag-suggestions">
          <div className="tags-title">💡 智能推荐</div>
          {suggestions.slice(0, 3).map((s) => (
            <div key={s.fileName} className="suggestion-item">
              <span className="suggestion-file">{s.fileName}</span>
              <div className="suggestion-tags">
                {s.tags.map((tagName) => {
                  const tag = tags.find((t) => t.name === tagName);
                  return (
                    <button
                      key={tagName}
                      className="suggestion-tag"
                      style={{ backgroundColor: `${tag?.color || "#9ca3af"}20`, color: tag?.color || "#9ca3af" }}
                      onClick={() => applySuggestion(s.fileName, [tagName])}
                      title={`为 ${s.fileName} 添加标签 "${tagName}"`}
                    >
                      + {tagName}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 标签管理弹窗 */}
      {showTagManager && (
        <div className="modal-overlay" onClick={() => setShowTagManager(false)}>
          <div className="modal-content" style={{ maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏷️ 标签管理</h3>
              <button className="modal-close" onClick={() => setShowTagManager(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* 添加新标签 */}
              <div className="tag-add-section">
                <input
                  type="text"
                  className="command-palette-input"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="输入新标签名称..."
                  onKeyDown={(e) => e.key === "Enter" && addTag()}
                />
                <div className="color-picker">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`color-dot ${newTagColor === color ? "selected" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTagColor(color)}
                    />
                  ))}
                </div>
                <button className="btn-primary" onClick={addTag} style={{ width: "100%" }}>
                  添加标签
                </button>
              </div>

              {/* 标签列表 */}
              <div className="tag-list">
                {tags.map((tag) => (
                  <div key={tag.id} className="tag-list-item">
                    {editingTag === tag.id ? (
                      // 编辑模式
                      <div className="tag-edit-form">
                        <input
                          type="text"
                          className="command-palette-input"
                          value={editTagName}
                          onChange={(e) => setEditTagName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveEditTag()}
                          autoFocus
                        />
                        <div className="color-picker">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              className={`color-dot ${editTagColor === color ? "selected" : ""}`}
                              style={{ backgroundColor: color }}
                              onClick={() => setEditTagColor(color)}
                            />
                          ))}
                        </div>
                        <div className="tag-edit-actions">
                          <button className="btn-secondary btn-sm" onClick={cancelEditTag}>取消</button>
                          <button className="btn-primary btn-sm" onClick={saveEditTag}>保存</button>
                        </div>
                      </div>
                    ) : (
                      // 显示模式
                      <>
                        <span className="tag-preview" style={{ backgroundColor: `${tag.color}20`, color: tag.color }}>
                          {tag.name}
                        </span>
                        <span className="tag-file-count">
                          {Object.values(fileTags).filter((t) => t.includes(tag.id)).length} 个文件
                        </span>
                        <button className="tag-edit-btn" onClick={() => startEditTag(tag)} title="编辑">✏️</button>
                        <button className="tag-delete-btn" onClick={() => deleteTag(tag.id)} title="删除">×</button>
                      </>
                    )}
                  </div>
                ))}
                {tags.length === 0 && (
                  <div className="empty-hint">暂无标签，创建第一个标签吧！</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 文件标签分配弹窗 */}
      {showTagAssigner && (
        <div className="modal-overlay" onClick={() => onShowTagAssigner(null)}>
          <div className="modal-content" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏷️ 为 "{showTagAssigner}" 添加标签</h3>
              <button className="modal-close" onClick={() => onShowTagAssigner(null)}>×</button>
            </div>
            <div className="modal-body">
              {/* 智能推荐 */}
              {suggestions.find((s) => s.fileName === showTagAssigner) && (
                <div className="tag-assign-section">
                  <div className="tag-assign-section-title">💡 智能推荐</div>
                  <div className="tag-assign-recommend">
                    {suggestions.find((s) => s.fileName === showTagAssigner)?.tags.map((tagName) => {
                      const tag = tags.find((t) => t.name === tagName);
                      return (
                        <button
                          key={tagName}
                          className="suggestion-tag"
                          style={{ backgroundColor: `${tag?.color || "#9ca3af"}20`, color: tag?.color || "#9ca3af" }}
                          onClick={() => applySuggestion(showTagAssigner, [tagName])}
                        >
                          + {tagName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 现有标签列表 */}
              <div className="tag-assign-section">
                <div className="tag-assign-section-title">已有标签</div>
                <div className="tag-assign-list">
                  {tags.map((tag) => {
                    const isSelected = (fileTags[showTagAssigner] || []).includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        className={`tag-assign-item ${isSelected ? "selected" : ""}`}
                        style={{
                          backgroundColor: isSelected ? `${tag.color}30` : undefined,
                          borderColor: isSelected ? tag.color : undefined,
                        }}
                        onClick={() => toggleFileTag(showTagAssigner, tag.id)}
                      >
                        <span className="tag-preview" style={{ backgroundColor: `${tag.color}20`, color: tag.color }}>
                          {tag.name}
                        </span>
                        {isSelected && <span>✓</span>}
                      </button>
                    );
                  })}
                  {tags.length === 0 && (
                    <div className="empty-hint">暂无标签，请在下方创建</div>
                  )}
                </div>
              </div>

              {/* 快速新建标签 */}
              <div className="tag-assign-section tag-quick-create">
                <div className="tag-assign-section-title">➕ 新建标签</div>
                <div className="tag-quick-create-form">
                  <input
                    type="text"
                    className="command-palette-input"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="输入标签名称..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const newTag: Tag = {
                          id: Date.now().toString(),
                          name: newTagName.trim(),
                          color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
                        };
                        if (newTag.name) {
                          onTagsChange([...tags, newTag]);
                          toggleFileTag(showTagAssigner, newTag.id);
                          setNewTagName("");
                        }
                      }
                    }}
                  />
                  <button
                    className="btn-primary btn-sm"
                    onClick={() => {
                      const newTag: Tag = {
                        id: Date.now().toString(),
                        name: newTagName.trim(),
                        color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
                      };
                      if (newTag.name) {
                        onTagsChange([...tags, newTag]);
                        toggleFileTag(showTagAssigner, newTag.id);
                        setNewTagName("");
                      }
                    }}
                  >
                    创建并添加
                  </button>
                </div>
                <div className="tag-quick-colors">
                  {PRESET_COLORS.slice(0, 8).map((color) => (
                    <button
                      key={color}
                      className={`color-dot-sm ${newTagColor === color ? "selected" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTagColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// 导出工具函数供外部使用
export { TAG_RULES, PRESET_COLORS };
