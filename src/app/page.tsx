"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Task, Project, Tag, Member } from "@/lib/types";
import { useLiveRefresh } from "@/lib/live-refresh";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/task-card";
import { TaskDetail } from "@/components/task-detail";
import { TaskForm } from "@/components/task-form";
import { FilterBar, Filters } from "@/components/filter-bar";
import { GanttChart } from "@/components/gantt-chart";
import { SettingsPanel } from "@/components/settings-panel";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  // 詳細ダイアログは「その時点の課題オブジェクト」ではなく id を保持する。
  // こうしておくと再取得のたびに開いている詳細も最新の内容に追従する。
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [view, setView] = useState<"card" | "gantt">("card");
  const [filters, setFilters] = useState<Filters>({
    projectId: "",
    categoryId: "",
    status: "__incomplete",
    assignee: "",
    tagId: "",
    thisWeek: false,
  });

  // Backlogコピーの「元報告」リンク(/?task=<id>)から開かれたとき、
  // 初回ロード後にその課題の詳細を自動で開く
  const deepLinkHandled = useRef(false);

  // 前回受け取ったレスポンスの生JSON。内容が同じなら setState せず、
  // 定期取得のたびに一覧が再描画されるのを防ぐ。
  const lastJson = useRef<Record<string, string>>({});

  const fetchAll = useCallback(async () => {
    try {
      const [tasksRes, projectsRes, tagsRes, membersRes] = await Promise.all([
        fetch("/api/tasks", { cache: "no-store" }),
        fetch("/api/projects", { cache: "no-store" }),
        fetch("/api/tags", { cache: "no-store" }),
        fetch("/api/members", { cache: "no-store" }),
      ]);
      if (!tasksRes.ok || !projectsRes.ok || !tagsRes.ok || !membersRes.ok) {
        console.error("Failed to fetch data");
        return;
      }
      const [tasksJson, projectsJson, tagsJson, membersJson] =
        await Promise.all([
          tasksRes.text(),
          projectsRes.text(),
          tagsRes.text(),
          membersRes.text(),
        ]);

      let tasksData: Task[] | null = null;
      if (lastJson.current.tasks !== tasksJson) {
        lastJson.current.tasks = tasksJson;
        tasksData = JSON.parse(tasksJson) as Task[];
        setTasks(tasksData);
      }
      if (lastJson.current.projects !== projectsJson) {
        lastJson.current.projects = projectsJson;
        setProjects(JSON.parse(projectsJson));
      }
      if (lastJson.current.tags !== tagsJson) {
        lastJson.current.tags = tagsJson;
        setTags(JSON.parse(tagsJson));
      }
      if (lastJson.current.members !== membersJson) {
        lastJson.current.members = membersJson;
        setMembers(JSON.parse(membersJson));
      }

      if (!deepLinkHandled.current && tasksData) {
        deepLinkHandled.current = true;
        const id = new URLSearchParams(window.location.search).get("task");
        if (id && tasksData.some((t) => t.id === id)) {
          setSelectedTaskId(id);
          setDetailOpen(true);
        }
      }
    } catch (e) {
      console.error("Failed to fetch data", e);
    }
  }, []);

  // 初回取得と、他の人が追加・編集した内容のリロードなしの取り込み
  useLiveRefresh(fetchAll);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  // 開いている課題が他の人に削除されたら、詳細は閉じる
  useEffect(() => {
    if (detailOpen && selectedTaskId && lastJson.current.tasks && !selectedTask) {
      setDetailOpen(false);
      setSelectedTaskId(null);
    }
  }, [detailOpen, selectedTaskId, selectedTask]);

  const assignees = useMemo(() => {
    const set = new Set(tasks.map((t) => t.assignee).filter(Boolean));
    return Array.from(set).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filters.projectId && t.projectId !== filters.projectId) return false;
      if (filters.categoryId && t.categoryId !== filters.categoryId)
        return false;
      if (filters.status === "__incomplete") {
        if (t.status === "処理済み" || t.status === "完了") return false;
      } else if (filters.status && t.status !== filters.status) return false;
      if (filters.assignee && t.assignee !== filters.assignee) return false;
      if (
        filters.tagId &&
        !t.tags.some(({ tag }) => tag.id === filters.tagId)
      )
        return false;
      if (filters.thisWeek) {
        if (!t.startDate || !t.dueDate) return false;
        const now = new Date();
        const day = now.getDay();
        const mon = new Date(now);
        mon.setDate(mon.getDate() - ((day + 6) % 7));
        mon.setHours(0, 0, 0, 0);
        const sun = new Date(mon);
        sun.setDate(sun.getDate() + 6);
        sun.setHours(23, 59, 59, 999);
        const start = new Date(t.startDate);
        const due = new Date(t.dueDate);
        if (due < mon || start > sun) return false;
      }
      return true;
    });
  }, [tasks, filters]);

  async function handleSave(
    data: {
      taskNumber: string;
      title: string;
      assignee: string;
      createdBy: string;
      status: string;
      description: string;
      backlogUrl: string;
      startDate: string;
      dueDate: string;
      projectId: string;
      categoryId: string;
      tagIds: string[];
      screenshots: { url: string; caption: string; isMain: boolean }[];
    },
    id?: string
  ) {
    try {
      const url = id ? `/api/tasks/${id}` : "/api/tasks";
      const method = id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        alert("保存に失敗しました");
        return;
      }
      setFormOpen(false);
      setEditingTask(null);
      await fetchAll();
    } catch {
      alert("保存に失敗しました");
    }
  }

  async function handleDelete() {
    if (!selectedTask) return;
    if (!confirm("この課題を削除しますか？")) return;
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("削除に失敗しました");
        return;
      }
      setDetailOpen(false);
      setSelectedTaskId(null);
      await fetchAll();
    } catch {
      alert("削除に失敗しました");
    }
  }

  function downloadCsv(rows: Task[]) {
    const headers = [
      "課題番号", "タイトル", "ステータス", "プロジェクト", "カテゴリー",
      "担当者", "起票者", "開始日", "期限日", "タグ", "説明", "Backlog URL", "画像URL",
    ];
    const esc = (v: string) => {
      if (!v) return "";
      if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
      return v;
    };
    const lines = rows.map((t) =>
      [
        t.taskNumber,
        t.title,
        t.status,
        t.project.name,
        t.category?.name || "",
        t.assignee || "",
        t.createdBy || "",
        t.startDate?.slice(0, 10) || "",
        t.dueDate?.slice(0, 10) || "",
        t.tags.map(({ tag }) => tag.name).join("、"),
        t.description || "",
        t.backlogUrl || "",
        t.screenshots.map((s) => s.url).join(" "),
      ]
        .map(esc)
        .join(",")
    );
    const csv = "﻿" + [headers.map(esc).join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tasks_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold tracking-tight">タスク認識合わせ</h1>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border overflow-hidden">
              <button
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "card" ? "bg-foreground text-background" : "hover:bg-muted"}`}
                onClick={() => setView("card")}
              >
                カード
              </button>
              <button
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "gantt" ? "bg-foreground text-background" : "hover:bg-muted"}`}
                onClick={() => setView("gantt")}
              >
                ガント
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(true)}
            >
              設定
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingTask(null);
                setFormOpen(true);
              }}
            >
              + 課題を追加
            </Button>
          </div>
        </div>
      </header>

      <main className={`mx-auto px-4 py-4 ${view === "card" ? "max-w-7xl" : ""}`}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            projects={projects}
            tags={tags}
            assignees={assignees}
          />
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => downloadCsv(filteredTasks)}
          >
            CSV
          </Button>
        </div>

        <p className="mb-3 text-xs text-muted-foreground">
          {filteredTasks.length} 件の課題
        </p>

        {view === "card" ? (
          filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <p className="text-sm">課題がありません</p>
              <p className="text-xs mt-1">
                「課題を追加」から新しい課題を登録してください
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => {
                    setSelectedTaskId(task.id);
                    setDetailOpen(true);
                  }}
                />
              ))}
            </div>
          )
        ) : (
          <GanttChart
            tasks={filteredTasks}
            onTaskClick={(task) => {
              setSelectedTaskId(task.id);
              setDetailOpen(true);
            }}
          />
        )}
      </main>

      <TaskDetail
        task={selectedTask}
        open={detailOpen}
        members={members}
        onClose={() => setDetailOpen(false)}
        onEdit={() => {
          setDetailOpen(false);
          setEditingTask(selectedTask);
          setFormOpen(true);
        }}
        onDelete={handleDelete}
      />

      <TaskForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSave}
        task={editingTask}
        projects={projects}
        tags={tags}
        members={members}
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        projects={projects}
        tags={tags}
        members={members}
        onRefresh={fetchAll}
      />
    </div>
  );
}
