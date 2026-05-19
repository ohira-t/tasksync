"use client";

import { Task } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  未対応: "bg-gray-200 text-gray-700",
  処理中: "bg-blue-100 text-blue-700",
  "途中で停止中": "bg-yellow-100 text-yellow-700",
  "プルリク依頼中": "bg-purple-100 text-purple-700",
  処理済み: "bg-emerald-100 text-emerald-700",
  完了: "bg-green-100 text-green-700",
};

export function TaskCard({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  const explicit = task.screenshots.find((s) => s.isMain);
  const mainShot = explicit || task.screenshots[0] || null;
  const subShots = task.screenshots.filter((s) => s.id !== mainShot?.id);

  return (
    <div
      className="group cursor-pointer rounded-xl border-[3px] bg-card p-4 transition-opacity hover:opacity-80"
      style={{ borderColor: task.project.color }}
      onClick={onClick}
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1 min-w-0 text-muted-foreground">
          <span className="font-medium shrink-0">【{task.project.name}】</span>
          <span className="font-mono shrink-0">{task.taskNumber}</span>
        </span>
        <span
          className={`rounded-full px-2 py-0.5 font-medium shrink-0 ${statusColors[task.status] || "bg-gray-100"}`}
        >
          {task.status}
        </span>
      </div>

      <h3 className="mb-2 text-[15px] font-semibold leading-tight line-clamp-2">
        {task.title}
      </h3>

      {mainShot ? (
        <div className="space-y-1.5">
          <div className="overflow-hidden rounded-lg bg-muted">
            <img
              src={mainShot.url}
              alt=""
              className="h-40 w-full object-cover"
            />
          </div>
          {subShots.length > 0 && (
            <div className="flex gap-1">
              {subShots.map((s) => (
                <img
                  key={s.id}
                  src={s.url}
                  alt=""
                  className="h-10 w-10 rounded object-cover border"
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg bg-muted text-muted-foreground text-xs">
          画像なし
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {task.assignee && (
          <span className="text-xs text-muted-foreground">
            👤 {task.assignee}
          </span>
        )}
        {task.tags.map(({ tag }) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="text-[10px] px-1.5 py-0"
            style={{ backgroundColor: tag.color + "20", color: tag.color }}
          >
            {tag.name}
          </Badge>
        ))}
      </div>

      {(task.startDate || task.dueDate) && (
        <div className="mt-2 text-[11px] text-muted-foreground">
          {task.startDate && <span>{task.startDate.slice(0, 10)}</span>}
          {task.startDate && task.dueDate && <span> → </span>}
          {task.dueDate && <span>{task.dueDate.slice(0, 10)}</span>}
        </div>
      )}
    </div>
  );
}
