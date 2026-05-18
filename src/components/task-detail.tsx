"use client";

import { Task } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScreenshotCarousel } from "./screenshot-carousel";
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
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: task.project.color }}
            />
            <span className="text-sm text-muted-foreground font-mono">
              {task.taskNumber}
            </span>
            <span
              className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[task.status] || "bg-gray-100"}`}
            >
              {task.status}
            </span>
          </div>
          <DialogTitle className="text-lg">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <ScreenshotCarousel screenshots={task.screenshots} />

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
