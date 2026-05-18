export type Project = {
  id: string;
  name: string;
  color: string;
  categories: Category[];
};

export type Category = {
  id: string;
  name: string;
  projectId: string;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
};

export type Screenshot = {
  id: string;
  url: string;
  caption: string;
  order: number;
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

export const STATUSES = ["未着手", "進行中", "レビュー", "完了"] as const;
