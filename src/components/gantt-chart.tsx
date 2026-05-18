"use client";

import { useMemo, useRef, useEffect } from "react";
import { Task } from "@/lib/types";

const statusColors: Record<string, string> = {
  未対応: "#9ca3af",
  処理中: "#3b82f6",
  "途中で停止中": "#eab308",
  "プルリク依頼中": "#a855f7",
  処理済み: "#10b981",
  完了: "#22c55e",
};

const DAY_WIDTH = 40;
const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 52;
const LABEL_WIDTH = 280;

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function GanttChart({
  tasks,
  onTaskClick,
}: {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const ganttTasks = useMemo(
    () => tasks.filter((t) => t.startDate && t.dueDate),
    [tasks]
  );

  const { startDate, totalDays, dates } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - 7);

    let end = new Date(today);
    end.setDate(end.getDate() + 30);

    for (const t of ganttTasks) {
      const due = new Date(t.dueDate!);
      if (due > end) end = new Date(due.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const total = daysBetween(start, end) + 1;
    const dateArr: Date[] = [];
    for (let i = 0; i < total; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dateArr.push(d);
    }

    return { startDate: start, totalDays: total, dates: dateArr };
  }, [ganttTasks]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 7 * DAY_WIDTH - 20;
    }
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOffset = daysBetween(startDate, today);

  if (ganttTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">表示できる課題がありません</p>
        <p className="text-xs mt-1">
          開始日と期限日が設定された課題のみ表示されます
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex">
        {/* Left labels */}
        <div
          className="shrink-0 border-r bg-muted/30"
          style={{ width: LABEL_WIDTH }}
        >
          <div
            className="border-b px-3 flex items-center text-xs font-medium text-muted-foreground"
            style={{ height: HEADER_HEIGHT }}
          >
            課題
          </div>
          {ganttTasks.map((task) => (
            <div
              key={task.id}
              className="border-b px-3 flex items-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
              style={{ height: ROW_HEIGHT }}
              onClick={() => onTaskClick(task)}
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: task.project.color }}
              />
              <span className="text-xs font-mono text-muted-foreground shrink-0">
                {task.taskNumber}
              </span>
              <span className="text-xs truncate">{task.title}</span>
            </div>
          ))}
        </div>

        {/* Right timeline */}
        <div className="overflow-x-auto flex-1" ref={scrollRef}>
          <div style={{ width: totalDays * DAY_WIDTH, minWidth: "100%" }}>
            {/* Date header */}
            <div
              className="flex border-b"
              style={{ height: HEADER_HEIGHT }}
            >
              {dates.map((d, i) => {
                const isToday = d.getTime() === today.getTime();
                const isSun = d.getDay() === 0;
                const isSat = d.getDay() === 6;
                return (
                  <div
                    key={i}
                    className={`shrink-0 flex flex-col items-center justify-center border-r text-[10px] ${
                      isToday
                        ? "bg-blue-50 font-bold text-blue-700"
                        : isSun
                          ? "text-red-400 bg-red-50/50"
                          : isSat
                            ? "text-blue-400 bg-blue-50/30"
                            : "text-muted-foreground"
                    }`}
                    style={{ width: DAY_WIDTH }}
                  >
                    <span>{formatDate(d)}</span>
                    <span className="text-[9px]">
                      {["日", "月", "火", "水", "木", "金", "土"][d.getDay()]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Task bars */}
            {ganttTasks.map((task) => {
              const taskStart = new Date(task.startDate!);
              taskStart.setHours(0, 0, 0, 0);
              const taskEnd = new Date(task.dueDate!);
              taskEnd.setHours(0, 0, 0, 0);
              const offsetDays = daysBetween(startDate, taskStart);
              const duration = daysBetween(taskStart, taskEnd) + 1;

              return (
                <div
                  key={task.id}
                  className="relative border-b"
                  style={{ height: ROW_HEIGHT }}
                >
                  {/* Grid lines */}
                  {dates.map((d, i) => {
                    const isSun = d.getDay() === 0;
                    const isSat = d.getDay() === 6;
                    const isToday = d.getTime() === today.getTime();
                    return (
                      <div
                        key={i}
                        className={`absolute top-0 bottom-0 border-r ${
                          isToday
                            ? "bg-blue-50/50"
                            : isSun
                              ? "bg-red-50/30"
                              : isSat
                                ? "bg-blue-50/20"
                                : ""
                        }`}
                        style={{ left: i * DAY_WIDTH, width: DAY_WIDTH }}
                      />
                    );
                  })}
                  {/* Today line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10"
                    style={{ left: todayOffset * DAY_WIDTH + DAY_WIDTH / 2 }}
                  />
                  {/* Bar */}
                  <div
                    className="absolute top-1.5 rounded cursor-pointer hover:brightness-110 transition-all"
                    style={{
                      left: offsetDays * DAY_WIDTH + 2,
                      width: Math.max(duration * DAY_WIDTH - 4, 8),
                      height: ROW_HEIGHT - 12,
                      backgroundColor:
                        statusColors[task.status] || "#9ca3af",
                      opacity: task.status === "完了" ? 0.5 : 0.85,
                    }}
                    onClick={() => onTaskClick(task)}
                  >
                    <span className="absolute inset-0 flex items-center px-1.5 text-[10px] text-white font-medium truncate">
                      {task.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
