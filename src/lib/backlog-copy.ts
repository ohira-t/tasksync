import { Task } from "@/lib/types";

// 見出し記法の切り替え:
//   "markdown" → "## 見出し"(Backlog のマークダウン記法プロジェクト向け)
//   "backlog"  → "* 見出し"(Backlog 独自記法プロジェクト向け)
export type HeadingMode = "markdown" | "backlog";
export const HEADING_MODE: HeadingMode = "markdown";

// 件名の接頭辞。文言を変えたいときはここを編集する
const SUBJECT_PREFIX = "[バグ] ";

function heading(text: string): string {
  return HEADING_MODE === "backlog" ? `* ${text}` : `## ${text}`;
}

export function buildBacklogSubject(task: Task): string {
  return `${SUBJECT_PREFIX}${task.title}`;
}

// Backlog の課題「詳細」欄に貼り付けるテキストを組み立てる。
// このアプリに存在しないテンプレート項目(再現手順・期待される動作・環境)は
// スキーマに対応フィールドが無いためセクションごと省略している。
export function buildBacklogBody(task: Task, taskUrl: string): string {
  const sections: string[] = [];

  if (task.description.trim()) {
    sections.push(`${heading("概要")}\n${task.description.trim()}`);
  }

  if (task.screenshots.length > 0) {
    sections.push(
      `${heading("スクリーンショット")}\n${task.screenshots
        .map((s) => s.url)
        .join("\n")}`
    );
  }

  sections.push(
    [
      "---",
      `報告者: ${task.createdBy || "不明"} / 報告日: ${task.createdAt.slice(0, 10)}`,
      `元報告: ${taskUrl}`,
    ].join("\n")
  );

  return sections.join("\n\n");
}
