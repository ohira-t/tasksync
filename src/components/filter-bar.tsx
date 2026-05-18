"use client";

import { Project, Tag, STATUSES } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Filters = {
  projectId: string;
  categoryId: string;
  status: string;
  assignee: string;
  tagId: string;
};

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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={filters.projectId || "all"}
        onValueChange={(v) =>
          onChange({
            ...filters,
            projectId: v === "all" ? "" : v,
            categoryId: "",
          })
        }
      >
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue placeholder="プロジェクト" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべてのプロジェクト</SelectItem>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                {p.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedProject && selectedProject.categories.length > 0 && (
        <Select
          value={filters.categoryId || "all"}
          onValueChange={(v) =>
            onChange({ ...filters, categoryId: v === "all" ? "" : v })
          }
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="カテゴリー" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {selectedProject.categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        value={filters.status || "all"}
        onValueChange={(v) =>
          onChange({ ...filters, status: v === "all" ? "" : v })
        }
      >
        <SelectTrigger className="w-[120px] h-8 text-xs">
          <SelectValue placeholder="ステータス" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべて</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {assignees.length > 0 && (
        <Select
          value={filters.assignee || "all"}
          onValueChange={(v) =>
            onChange({ ...filters, assignee: v === "all" ? "" : v })
          }
        >
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="担当者" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {assignees.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {tags.length > 0 && (
        <div className="flex gap-1">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant={filters.tagId === tag.id ? "default" : "outline"}
              className="cursor-pointer text-[10px] h-6"
              style={
                filters.tagId === tag.id
                  ? { backgroundColor: tag.color, color: "white" }
                  : {}
              }
              onClick={() =>
                onChange({
                  ...filters,
                  tagId: filters.tagId === tag.id ? "" : tag.id,
                })
              }
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

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
