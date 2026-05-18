"use client";

import { Task } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ScreenshotCarousel } from "./screenshot-carousel";

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
  return (
    <div
      className="group cursor-pointer rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: task.project.color }}
          />
          <span className="text-xs text-muted-foreground font-mono">
            {task.taskNumber}
          </span>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[task.status] || "bg-gray-100"}`}
        >
          {task.status}
        </span>
      </div>

      <h3 className="mb-2 text-sm font-semibold leading-tight line-clamp-2">
        {task.title}
      </h3>

      <ScreenshotCarousel screenshots={task.screenshots} />

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
