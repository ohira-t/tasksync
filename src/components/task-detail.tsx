"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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

function ImageViewer({
  src,
  onClose,
}: {
  src: string;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    setScale((s) => Math.min(Math.max(s - e.deltaY * 0.001, 0.5), 5));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      dragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    []
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    e.stopPropagation();
    setPos((p) => ({
      x: p.x + e.clientX - lastPos.current.x,
      y: p.y + e.clientY - lastPos.current.y,
    }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    dragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === containerRef.current) onClose();
    },
    [onClose]
  );

  useEffect(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, [src]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70"
      onClick={handleBackdropClick}
      onWheel={handleWheel}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <span className="text-white/70 text-xs select-none">
          {Math.round(scale * 100)}% ｜ ドラッグで移動 ｜ スクロールで拡大縮小
        </span>
        <button
          className="text-white/70 hover:text-white text-2xl leading-none px-2"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <img
        src={src}
        alt=""
        draggable={false}
        className="select-none rounded-lg"
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
          cursor: dragging.current ? "grabbing" : "grab",
          maxHeight: "90vh",
          maxWidth: "90vw",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
}

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
  const subShots = task.screenshots.filter((s) => s.id !== mainShot?.id);

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
            <ImageViewer
              src={viewingImage}
              onClose={() => setViewingImage(null)}
            />
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

          {task.backlogUrl && /^https?:\/\//i.test(task.backlogUrl) && (
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
