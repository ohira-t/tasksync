export type Project = {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  categories: Category[];
};

export type Category = {
  id: string;
  name: string;
  sortOrder: number;
  projectId: string;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
};

export type Screenshot = {
  id: string;
  url: string;
  caption: string;
  order: number;
  isMain: boolean;
};

export type Task = {
  id: string;
  taskNumber: string;
  title: string;
  assignee: string;
  status: string;
  description: string;
  startDate: string | null;
  dueDate: string | null;
  projectId: string;
  project: Project;
  categoryId: string | null;
  category: Category | null;
  tags: { tag: Tag }[];
  screenshots: Screenshot[];
  createdAt: string;
  updatedAt: string;
};

export const STATUSES = ["未対応", "処理中", "途中で停止中", "プルリク依頼中", "処理済み", "完了"] as const;
