"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Project, Tag, STATUSES } from "@/lib/types";

export type Filters = {
  projectId: string;
  categoryId: string;
  status: string;
  assignee: string;
  tagId: string;
  thisWeek: boolean;
};

export const defaultFilters: Filters = {
  projectId: "",
  categoryId: "",
  status: "__incomplete",
  assignee: "",
  tagId: "",
  thisWeek: false,
};

// 絞り込み条件は人それぞれなので、サーバーには送らず各自のブラウザに残す。
// state に入れて useEffect で当てるとサーバー描画との食い違いが出るため、
// localStorage を外部ストアとして描画中にそのまま読む。
const FILTERS_STORAGE_KEY = "tasksync:filters";

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedFilters: Filters = defaultFilters;
// localStorage が使えない環境(プライベートモード等)ではメモリ上だけで保持する
let storageBroken = false;
let memoryFilters: Filters = defaultFilters;

function parseFilters(raw: string | null): Filters {
  if (!raw) return defaultFilters;
  try {
    const saved = JSON.parse(raw) as Partial<Filters>;
    // 壊れた値や古い形式が入っていても画面が崩れないよう、1項目ずつ検証する
    const str = (v: unknown) => (typeof v === "string" ? v : "");
    return {
      projectId: str(saved.projectId),
      categoryId: str(saved.categoryId),
      status: str(saved.status),
      assignee: str(saved.assignee),
      tagId: str(saved.tagId),
      thisWeek: saved.thisWeek === true,
    };
  } catch {
    return defaultFilters;
  }
}

// 同じ値なら同じオブジェクトを返す必要がある(useSyncExternalStore の要件)
function getSnapshot(): Filters {
  if (storageBroken) return memoryFilters;
  let raw: string | null;
  try {
    raw = localStorage.getItem(FILTERS_STORAGE_KEY);
  } catch {
    storageBroken = true;
    return memoryFilters;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedFilters = parseFilters(raw);
  }
  return cachedFilters;
}

function getServerSnapshot(): Filters {
  return defaultFilters;
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  // 同じ人が複数タブを開いているとき、片方での変更をもう片方にも反映する
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function useFilters(): [Filters, (next: Filters) => void] {
  const filters = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const setFilters = useCallback((next: Filters) => {
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      storageBroken = true;
      memoryFilters = next;
    }
    listeners.forEach((notify) => notify());
  }, []);
  return [filters, setFilters];
}

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

      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.thisWeek}
          onChange={(e) =>
            onChange({ ...filters, thisWeek: e.target.checked })
          }
          className="h-3.5 w-3.5 rounded border-input accent-foreground"
        />
        <span className="text-xs whitespace-nowrap">今週</span>
      </label>

      {(filters.projectId ||
        filters.categoryId ||
        filters.status ||
        filters.assignee ||
        filters.tagId ||
        filters.thisWeek) && (
        <button
          onClick={() =>
            onChange({
              projectId: "",
              categoryId: "",
              status: "",
              assignee: "",
              tagId: "",
              thisWeek: false,
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
