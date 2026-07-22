"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Task, Comment, Member } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MemberSelect } from "@/components/task-form";
import { BacklogCopyMenu } from "@/components/backlog-copy-menu";
import { getSavedUserName, saveUserName } from "@/lib/user-name";
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
  const [grabbing, setGrabbing] = useState(false);
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
      setGrabbing(true);
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
    setGrabbing(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === containerRef.current) onClose();
    },
    [onClose]
  );

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
          cursor: grabbing ? "grabbing" : "grab",
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

function CommentSection({
  taskId,
  members,
}: {
  taskId: string;
  members: Member[];
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState(getSavedUserName);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/tasks/${taskId}/comments`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setComments(data);
      } catch {
        // 取得失敗時は空のまま表示する
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  async function handleSubmit() {
    if (submitting) return;
    const text = body.trim();
    const name = authorName.trim();
    if (!text || !name) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text, authorName: name }),
      });
      if (!res.ok) {
        alert("コメントの投稿に失敗しました");
        return;
      }
      const created: Comment = await res.json();
      setComments((prev) => [...prev, created]);
      setBody("");
      saveUserName(name);
    } catch {
      alert("コメントの投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("このコメントを削除しますか？")) return;
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("コメントの削除に失敗しました");
        return;
      }
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert("コメントの削除に失敗しました");
    }
  }

  return (
    <div className="space-y-3 border-t pt-4">
      <h3 className="text-sm font-semibold">
        コメント
        {comments.length > 0 && (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            {comments.length}件
          </span>
        )}
      </h3>

      {loading ? (
        <p className="text-xs text-muted-foreground">読み込み中...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          コメントはまだありません
        </p>
      ) : (
        <div className="space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg bg-muted/50 p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-sm font-medium truncate">
                    {c.authorName}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(c.createdAt).toLocaleString("ja-JP", {
                      year: "numeric",
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleDelete(c.id)}
                >
                  削除
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm">{c.body}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <div className="max-w-48">
          <MemberSelect
            value={authorName}
            onChange={setAuthorName}
            members={members}
            emptyLabel="名前を選択"
          />
        </div>
        <div className="flex items-end gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            placeholder="コメントを入力"
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || !body.trim() || !authorName.trim()}
          >
            {submitting ? "投稿中..." : "投稿"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Dialog を閉じると Base UI の Portal(keepMounted=false)ごとアンマウントされるため、
// 画像ビューアやコメント入力の state はこのコンポーネント内に閉じ込める。
// 以前は親(TaskDetail)側で viewingImage を保持していたため、✕以外の方法で
// ダイアログを閉じると前の課題の画像が残るバグがあった。
function TaskDetailBody({
  task,
  members,
  onEdit,
  onDelete,
}: {
  task: Task;
  members: Member[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const explicit = task.screenshots.find((s) => s.isMain);
  const mainShot = explicit || task.screenshots[0] || null;
  const subShots = task.screenshots.filter((s) => s.id !== mainShot?.id);

  return (
    <>
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
          {task.backlogUrl && (
            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap bg-sky-100 text-sky-700">
              転記済み
            </span>
          )}
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
            key={viewingImage}
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
          {task.createdBy && (
            <div>
              <span className="text-muted-foreground">起票者:</span>{" "}
              <span className="font-medium">{task.createdBy}</span>
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

        <CommentSection taskId={task.id} members={members} />

        <div className="flex items-center gap-2 pt-2">
          <BacklogCopyMenu task={task} />
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={onEdit}>
            編集
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            削除
          </Button>
        </div>
      </div>
    </>
  );
}

export function TaskDetail({
  task,
  open,
  onClose,
  onEdit,
  onDelete,
  members,
}: {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  members: Member[];
}) {
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <TaskDetailBody
          key={task.id}
          task={task}
          members={members}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </DialogContent>
    </Dialog>
  );
}
