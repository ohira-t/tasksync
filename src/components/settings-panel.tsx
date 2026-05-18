"use client";

import { useState } from "react";
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div>
            <Label className="text-sm font-semibold">プロジェクト追加</Label>
            <div className="mt-1 flex gap-2">
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="プロジェクト名"
                className="flex-1"
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
            <div className="mt-2 flex flex-wrap gap-1.5">
              {projects.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  {p.name}
                </span>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-semibold">カテゴリー追加</Label>
            <div className="mt-1 flex gap-2">
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
              />
              <Button size="sm" onClick={addCategory}>
                追加
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-semibold">タグ追加</Label>
            <div className="mt-1 flex gap-2">
              <Input
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="タグ名"
                className="flex-1"
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
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                  style={{
                    backgroundColor: t.color + "20",
                    color: t.color,
                  }}
                >
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
