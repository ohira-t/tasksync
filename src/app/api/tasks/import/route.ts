import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const VALID_STATUSES = ["未対応", "処理中", "途中で停止中", "プルリク依頼中", "処理済み", "完了"];

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  while (i < text.length) {
    const row: string[] = [];
    while (i < text.length) {
      if (text[i] === '"') {
        i++;
        let val = "";
        while (i < text.length) {
          if (text[i] === '"') {
            if (text[i + 1] === '"') {
              val += '"';
              i += 2;
            } else {
              i++;
              break;
            }
          } else {
            val += text[i];
            i++;
          }
        }
        row.push(val);
        if (text[i] === ",") i++;
      } else {
        let val = "";
        while (i < text.length && text[i] !== "," && text[i] !== "\n" && text[i] !== "\r") {
          val += text[i];
          i++;
        }
        row.push(val);
        if (text[i] === ",") i++;
      }
      if (i >= text.length || text[i] === "\n" || text[i] === "\r") break;
    }
    if (text[i] === "\r") i++;
    if (text[i] === "\n") i++;
    rows.push(row);
  }
  return rows;
}

function parseDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s.replace(/\//g, "-"));
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const buf = await file.arrayBuffer();
    let text: string;
    try {
      const decoder = new TextDecoder("shift_jis");
      text = decoder.decode(buf);
    } catch {
      text = new TextDecoder("utf-8").decode(buf);
    }

    const rows = parseCSV(text);
    if (rows.length < 2) {
      return NextResponse.json({ error: "Empty CSV" }, { status: 400 });
    }

    const header = rows[0];
    const keyIdx = header.indexOf("キー");
    const statusIdx = header.indexOf("状態");
    const startIdx = header.indexOf("開始日");
    const dueIdx = header.indexOf("期限日");

    if (keyIdx === -1 || statusIdx === -1) {
      return NextResponse.json({ error: "Required columns not found: キー, 状態" }, { status: 400 });
    }

    const updates: { key: string; status: string; startDate: string; dueDate: string }[] = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const key = row[keyIdx]?.trim();
      if (!key) continue;
      updates.push({
        key,
        status: row[statusIdx]?.trim() || "",
        startDate: startIdx >= 0 ? row[startIdx]?.trim() || "" : "",
        dueDate: dueIdx >= 0 ? row[dueIdx]?.trim() || "" : "",
      });
    }

    const existing = await prisma.task.findMany({
      select: { id: true, taskNumber: true },
    });
    const taskMap = new Map(existing.map((t) => [t.taskNumber, t.id]));

    let updated = 0;
    let skipped = 0;
    for (const u of updates) {
      const taskId = taskMap.get(u.key);
      if (!taskId) {
        skipped++;
        continue;
      }
      const data: Record<string, unknown> = {};
      if (u.status && VALID_STATUSES.includes(u.status)) {
        data.status = u.status;
      }
      if (u.startDate) {
        const d = parseDate(u.startDate);
        if (d) data.startDate = d;
      }
      if (u.dueDate) {
        const d = parseDate(u.dueDate);
        if (d) data.dueDate = d;
      }
      if (Object.keys(data).length === 0) {
        skipped++;
        continue;
      }
      await prisma.task.update({ where: { id: taskId }, data });
      updated++;
    }

    return NextResponse.json({ updated, skipped, total: updates.length });
  } catch (e) {
    console.error("Import error:", e);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
