"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Task, Project, Tag } from "@/lib/types";
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [view, setView] = useState<"card" | "gantt">("card");
  const [filters, setFilters] = useState<Filters>({
    projectId: "",
    categoryId: "",
    status: "",
    assignee: "",
    tagId: "",
  });

  const fetchAll = useCallback(async () => {
    const [tasksRes, projectsRes, tagsRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/projects"),
      fetch("/api/tags"),
    ]);
    setTasks(await tasksRes.json());
    setProjects(await projectsRes.json());
    setTags(await tagsRes.json());
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const assignees = useMemo(() => {
    const set = new Set(tasks.map((t) => t.assignee).filter(Boolean));
    return Array.from(set).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filters.projectId && t.projectId !== filters.projectId) return false;
      if (filters.categoryId && t.categoryId !== filters.categoryId)
        return false;
      if (filters.status && t.status !== filters.status) return false;
      if (filters.assignee && t.assignee !== filters.assignee) return false;
      if (
        filters.tagId &&
        !t.tags.some(({ tag }) => tag.id === filters.tagId)
      )
        return false;
      return true;
    });
  }, [tasks, filters]);

  async function handleSave(
    data: {
      taskNumber: string;
      title: string;
      assignee: string;
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
    const url = id ? `/api/tasks/${id}` : "/api/tasks";
    const method = id ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setFormOpen(false);
    setEditingTask(null);
    await fetchAll();
  }

  async function handleDelete() {
    if (!selectedTask) return;
    if (!confirm("この課題を削除しますか？")) return;
    await fetch(`/api/tasks/${selectedTask.id}`, { method: "DELETE" });
    setDetailOpen(false);
    setSelectedTask(null);
    await fetchAll();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold tracking-tight">TaskSync</h1>
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
        <div className="mb-4">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            projects={projects}
            tags={tags}
            assignees={assignees}
          />
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
                    setSelectedTask(task);
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
              setSelectedTask(task);
              setDetailOpen(true);
            }}
          />
        )}
      </main>

      <TaskDetail
        task={selectedTask}
        open={detailOpen}
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
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        projects={projects}
        tags={tags}
        onRefresh={fetchAll}
      />
    </div>
  );
}
