"use client";

import { useState, useEffect } from "react";
import { Project, Tag } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Pencil,
  Trash2,
  Check,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

function InlineEdit({
  item,
  editing,
  onStartEdit,
  onSave,
  onDelete,
  onCancel,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  showColor,
}: {
  item: { id: string; name: string; color?: string };
  editing: boolean;
  onStartEdit: () => void;
  onSave: (name: string, color?: string) => void;
  onDelete: () => void;
  onCancel: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  showColor?: boolean;
}) {
  const [name, setName] = useState(item.name);
  const [color, setColor] = useState(item.color || "#6366f1");

  useEffect(() => {
    if (editing) {
      setName(item.name);
      setColor(item.color || "#6366f1");
    }
  }, [editing, item.name, item.color]);

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg border bg-muted/50 px-2 py-1.5">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-7 text-xs flex-1"
          autoFocus
        />
        {showColor && (
          <Input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-7 w-9 p-0.5"
          />
        )}
        <button
          onClick={() => onSave(name, color)}
          className="p-1 rounded hover:bg-accent text-green-600"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onCancel}
          className="p-1 rounded hover:bg-accent text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs hover:bg-muted/50 transition-colors">
      <div className="flex flex-col mr-0.5">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="p-0 leading-none text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-default"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="p-0 leading-none text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-default"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
      {showColor && (
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: item.color }}
        />
      )}
      <span className="flex-1 ml-0.5">{item.name}</span>
      <button
        onClick={onStartEdit}
        className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-accent transition-opacity"
      >
        <Pencil className="h-3 w-3 text-muted-foreground" />
      </button>
      <button
        onClick={onDelete}
        className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-opacity"
      >
        <Trash2 className="h-3 w-3 text-destructive" />
      </button>
    </div>
  );
}

export function SettingsPanel({
  open,
  onClose,
  projects,
  tags,
  onRefresh,
}: {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  tags: Tag[];
  onRefresh: () => void;
}) {
  const [projectName, setProjectName] = useState("");
  const [projectColor, setProjectColor] = useState("#6366f1");
  const [categoryName, setCategoryName] = useState("");
  const [categoryProjectId, setCategoryProjectId] = useState("");
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState("#8b5cf6");
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingTag, setEditingTag] = useState<string | null>(null);

  async function reorder(
    type: "project" | "category" | "tag",
    id: string,
    direction: "up" | "down"
  ) {
    await fetch("/api/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id, direction }),
    });
    onRefresh();
  }

  async function addProject() {
    if (!projectName) return;
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: projectName, color: projectColor }),
    });
    setProjectName("");
    onRefresh();
  }

  async function updateProject(id: string, name: string, color?: string) {
    await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    setEditingProject(null);
    onRefresh();
  }

  async function deleteProject(id: string) {
    if (!confirm("このプロジェクトを削除しますか？関連する課題も影響を受けます。"))
      return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    onRefresh();
  }

  async function addCategory() {
    if (!categoryName || !categoryProjectId) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: categoryName,
        projectId: categoryProjectId,
      }),
    });
    setCategoryName("");
    onRefresh();
  }

  async function updateCategory(id: string, name: string) {
    await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setEditingCategory(null);
    onRefresh();
  }

  async function deleteCategory(id: string) {
    if (!confirm("このカテゴリーを削除しますか？")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    onRefresh();
  }

  async function addTag() {
    if (!tagName) return;
    await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: tagName, color: tagColor }),
    });
    setTagName("");
    onRefresh();
  }

  async function updateTag(id: string, name: string, color?: string) {
    await fetch(`/api/tags/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    setEditingTag(null);
    onRefresh();
  }

  async function deleteTag(id: string) {
    if (!confirm("このタグを削除しますか？")) return;
    await fetch(`/api/tags/${id}`, { method: "DELETE" });
    onRefresh();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Projects */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">プロジェクト</Label>
            <div className="flex gap-2">
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="プロジェクト名"
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && addProject()}
              />
              <Input
                type="color"
                value={projectColor}
                onChange={(e) => setProjectColor(e.target.value)}
                className="w-12 p-1"
              />
              <Button size="sm" onClick={addProject}>
                追加
              </Button>
            </div>
            {projects.length > 0 && (
              <div className="space-y-1.5">
                {projects.map((p, i) => (
                  <div key={p.id}>
                    <InlineEdit
                      item={p}
                      editing={editingProject === p.id}
                      onStartEdit={() => setEditingProject(p.id)}
                      onSave={(name, color) => updateProject(p.id, name, color)}
                      onDelete={() => deleteProject(p.id)}
                      onCancel={() => setEditingProject(null)}
                      onMoveUp={() => reorder("project", p.id, "up")}
                      onMoveDown={() => reorder("project", p.id, "down")}
                      isFirst={i === 0}
                      isLast={i === projects.length - 1}
                      showColor
                    />
                    {p.categories.length > 0 && (
                      <div className="ml-7 mt-1 space-y-1">
                        {p.categories.map((c, ci) => (
                          <InlineEdit
                            key={c.id}
                            item={c}
                            editing={editingCategory === c.id}
                            onStartEdit={() => setEditingCategory(c.id)}
                            onSave={(name) => updateCategory(c.id, name)}
                            onDelete={() => deleteCategory(c.id)}
                            onCancel={() => setEditingCategory(null)}
                            onMoveUp={() => reorder("category", c.id, "up")}
                            onMoveDown={() =>
                              reorder("category", c.id, "down")
                            }
                            isFirst={ci === 0}
                            isLast={ci === p.categories.length - 1}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Categories */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">カテゴリー追加</Label>
            <div className="flex gap-2">
              <select
                value={categoryProjectId}
                onChange={(e) => setCategoryProjectId(e.target.value)}
                className="rounded-md border px-2 py-1 text-sm"
              >
                <option value="">プロジェクト選択</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="カテゴリー名"
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
              />
              <Button size="sm" onClick={addCategory}>
                追加
              </Button>
            </div>
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">タグ</Label>
            <div className="flex gap-2">
              <Input
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="タグ名"
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && addTag()}
              />
              <Input
                type="color"
                value={tagColor}
                onChange={(e) => setTagColor(e.target.value)}
                className="w-12 p-1"
              />
              <Button size="sm" onClick={addTag}>
                追加
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="space-y-1.5">
                {tags.map((t, i) => (
                  <InlineEdit
                    key={t.id}
                    item={t}
                    editing={editingTag === t.id}
                    onStartEdit={() => setEditingTag(t.id)}
                    onSave={(name, color) => updateTag(t.id, name, color)}
                    onDelete={() => deleteTag(t.id)}
                    onCancel={() => setEditingTag(null)}
                    onMoveUp={() => reorder("tag", t.id, "up")}
                    onMoveDown={() => reorder("tag", t.id, "down")}
                    isFirst={i === 0}
                    isLast={i === tags.length - 1}
                    showColor
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
