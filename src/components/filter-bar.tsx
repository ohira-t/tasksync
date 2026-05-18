"use client";

import { Project, Tag, STATUSES } from "@/lib/types";

export type Filters = {
  projectId: string;
  categoryId: string;
  status: string;
  assignee: string;
  tagId: string;
};

const selectClass =
  "h-8 rounded-md border border-input bg-transparent pl-2.5 pr-8 py-1 text-xs shadow-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/50";

export function FilterBar({
  filters,
  onChange,
  projects,
  tags,
  assignees,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  projects: Project[];
  tags: Tag[];
  assignees: string[];
}) {
  const selectedProject = projects.find((p) => p.id === filters.projectId);
  const categories = selectedProject
    ? selectedProject.categories
    : projects.flatMap((p) => p.categories);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={filters.projectId}
        onChange={(e) =>
          onChange({ ...filters, projectId: e.target.value, categoryId: "" })
        }
        className={selectClass}
      >
        <option value="">すべてのプロジェクト</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <select
        value={filters.categoryId}
        onChange={(e) =>
          onChange({ ...filters, categoryId: e.target.value })
        }
        className={selectClass}
      >
        <option value="">すべてのカテゴリー</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(e) =>
          onChange({ ...filters, status: e.target.value })
        }
        className={selectClass}
      >
        <option value="">すべてのステータス</option>
        <option value="__incomplete">未完了（処理済み・完了以外）</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={filters.tagId}
        onChange={(e) =>
          onChange({ ...filters, tagId: e.target.value })
        }
        className={selectClass}
      >
        <option value="">すべてのタグ</option>
        {tags.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      <select
        value={filters.assignee}
        onChange={(e) =>
          onChange({ ...filters, assignee: e.target.value })
        }
        className={selectClass}
      >
        <option value="">すべての担当者</option>
        {assignees.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      {(filters.projectId ||
        filters.categoryId ||
        filters.status ||
        filters.assignee ||
        filters.tagId) && (
        <button
          onClick={() =>
            onChange({
              projectId: "",
              categoryId: "",
              status: "",
              assignee: "",
              tagId: "",
            })
          }
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          クリア
        </button>
      )}
    </div>
  );
}
