"use client";

import { useState } from "react";
import { Task } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const statusColors: Record<string, string> = {
  未対応: "bg-gray-200 text-gray-700",
  処理中: "bg-blue-100 text-blue-700",
  "途中で停止中": "bg-yellow-100 text-yellow-700",
  "プルリク依頼中": "bg-purple-100 text-purple-700",
  処理済み: "bg-emerald-100 text-emerald-700",
  完了: "bg-green-100 text-green-700",
};

export function TaskDetail({
  task,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  if (!task) return null;

  const explicit = task.screenshots.find((s) => s.isMain);
  const mainShot = explicit || task.screenshots[0] || null;
  const subShots = task.screenshots.filter((s) => s !== mainShot);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 pr-8">
            <span
              className="inline-block h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: task.project.color }}
            />
            <span className="text-sm text-muted-foreground font-mono">
              {task.taskNumber}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${statusColors[task.status] || "bg-gray-100"}`}
            >
              {task.status}
            </span>
          </div>
          <DialogTitle className="text-lg font-semibold">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {mainShot ? (
            <div className="space-y-2">
              <div
                className="overflow-hidden rounded-lg bg-muted cursor-pointer"
                onClick={() => setViewingImage(mainShot.url)}
              >
                <img
                  src={mainShot.url}
                  alt={mainShot.caption || "メイン画像"}
                  className="h-64 w-full object-contain"
                />
              </div>
              {subShots.length > 0 && (
                <div className="flex gap-2">
                  {subShots.map((s) => (
                    <img
                      key={s.id}
                      src={s.url}
                      alt={s.caption || ""}
                      className="h-16 w-16 rounded-lg object-cover border cursor-pointer hover:ring-2 hover:ring-ring transition-shadow"
                      onClick={() => setViewingImage(s.url)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg bg-muted text-muted-foreground text-sm">
              スクリーンショットなし
            </div>
          )}

          {viewingImage && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 cursor-pointer"
              onClick={() => setViewingImage(null)}
            >
              <img
                src={viewingImage}
                alt=""
                className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">プロジェクト:</span>{" "}
              <span className="font-medium">{task.project.name}</span>
            </div>
            {task.category && (
              <div>
                <span className="text-muted-foreground">カテゴリー:</span>{" "}
                <span className="font-medium">{task.category.name}</span>
              </div>
            )}
            {task.assignee && (
              <div>
                <span className="text-muted-foreground">担当者:</span>{" "}
                <span className="font-medium">{task.assignee}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">期間:</span>{" "}
              <span className="font-medium">
                {task.startDate ? task.startDate.slice(0, 10) : "未定"}
                {" → "}
                {task.dueDate ? task.dueDate.slice(0, 10) : "未定"}
              </span>
            </div>
          </div>

          {task.backlogUrl && (
            <div className="text-sm">
              <span className="text-muted-foreground">Backlog:</span>{" "}
              <a
                href={task.backlogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline break-all"
              >
                {task.backlogUrl}
              </a>
            </div>
          )}

          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {task.tags.map(({ tag }) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  style={{
                    backgroundColor: tag.color + "20",
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {task.description && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="whitespace-pre-wrap text-sm">{task.description}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              編集
            </Button>
            <Button variant="destructive" size="sm" onClick={onDelete}>
              削除
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
