"use client";

import { useState, useRef, useEffect } from "react";
import { Task, Project, Tag, STATUSES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ScreenshotInput = { url: string; caption: string };

type FormData = {
  taskNumber: string;
  title: string;
  assignee: string;
  status: string;
  description: string;
  startDate: string;
  dueDate: string;
  projectId: string;
  categoryId: string;
  tagIds: string[];
  screenshots: ScreenshotInput[];
};

const emptyForm: FormData = {
  taskNumber: "",
  title: "",
  assignee: "",
  status: "未対応",
  description: "",
  startDate: "",
  dueDate: "",
  projectId: "",
  categoryId: "",
  tagIds: [],
  screenshots: [],
};

export function TaskForm({
  open,
  onClose,
  onSave,
  task,
  projects,
  tags,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: FormData, id?: string) => void;
  task: Task | null;
  projects: Project[];
  tags: Tag[];
}) {
  const [form, setForm] = useState<FormData>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setForm({
        taskNumber: task.taskNumber,
        title: task.title,
        assignee: task.assignee,
        status: task.status,
        description: task.description,
        startDate: task.startDate ? task.startDate.slice(0, 10) : "",
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
        projectId: task.projectId,
        categoryId: task.categoryId || "",
        tagIds: task.tags.map((t) => t.tag.id),
        screenshots: task.screenshots.map((s) => ({
          url: s.url,
          caption: s.caption,
        })),
      });
    } else {
      setForm(emptyForm);
    }
  }, [task, open]);

  const selectedProject = projects.find((p) => p.id === form.projectId);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const newScreenshots = [...form.screenshots];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      newScreenshots.push({ url: data.url, caption: "" });
    }
    setForm({ ...form, screenshots: newScreenshots });
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeScreenshot(idx: number) {
    setForm({
      ...form,
      screenshots: form.screenshots.filter((_, i) => i !== idx),
    });
  }

  function toggleTag(tagId: string) {
    setForm({
      ...form,
      tagIds: form.tagIds.includes(tagId)
        ? form.tagIds.filter((id) => id !== tagId)
        : [...form.tagIds, tagId],
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "課題を編集" : "課題を追加"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>課題番号</Label>
              <Input
                value={form.taskNumber}
                onChange={(e) =>
                  setForm({ ...form, taskNumber: e.target.value })
                }
                placeholder="PROJ-001"
              />
            </div>
            <div className="space-y-1.5">
              <Label>ステータス</Label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>タイトル</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="課題のタイトル"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>プロジェクト</Label>
              <select
                value={form.projectId}
                onChange={(e) =>
                  setForm({ ...form, projectId: e.target.value, categoryId: "" })
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                <option value="">選択してください</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>カテゴリー</Label>
              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                <option value="">なし</option>
                {selectedProject?.categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>担当者</Label>
              <Input
                value={form.assignee}
                onChange={(e) =>
                  setForm({ ...form, assignee: e.target.value })
                }
                placeholder="担当者名"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>開始日</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>期限日</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {tags.length > 0 && (
            <div>
              <Label>タグ</Label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={
                      form.tagIds.includes(tag.id) ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    style={
                      form.tagIds.includes(tag.id)
                        ? { backgroundColor: tag.color, color: "white" }
                        : {}
                    }
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>詳細</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={4}
              placeholder="修正内容の詳細や補足"
            />
          </div>

          <div className="space-y-1.5">
            <Label>スクリーンショット</Label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {form.screenshots.map((s, i) => (
                <div key={i} className="relative group">
                  <img
                    src={s.url}
                    alt=""
                    className="h-24 w-full rounded-lg object-cover border"
                  />
                  <button
                    type="button"
                    onClick={() => removeScreenshot(i)}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <Input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="mt-2"
              disabled={uploading}
            />
            {uploading && (
              <p className="text-xs text-muted-foreground mt-1">
                アップロード中...
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button
              onClick={() => onSave(form, task?.id)}
              disabled={!form.taskNumber || !form.title || !form.projectId}
            >
              {task ? "更新" : "追加"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
