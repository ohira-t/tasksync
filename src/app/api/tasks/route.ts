import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const VALID_STATUSES = ["未対応", "処理中", "途中で停止中", "プルリク依頼中", "処理済み", "完了"];

function sanitizeUrl(url: string): string {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : "";
}

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        project: true,
        category: true,
        tags: { include: { tag: true } },
        screenshots: { orderBy: { order: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    const status = VALID_STATUSES.includes(body.status) ? body.status : "未対応";

    let projectId = body.projectId;
    if (!projectId) {
      const first = await prisma.project.findFirst({ orderBy: { sortOrder: "asc" } });
      if (!first) {
        return NextResponse.json({ error: "No projects exist" }, { status: 400 });
      }
      projectId = first.id;
    }

    const task = await prisma.task.create({
      data: {
        taskNumber: body.taskNumber || "",
        title: body.title,
        assignee: body.assignee || "",
        status,
        description: body.description || "",
        backlogUrl: sanitizeUrl(body.backlogUrl || ""),
        startDate: body.startDate ? new Date(body.startDate) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        projectId,
        categoryId: body.categoryId || null,
        tags: body.tagIds?.length
          ? { create: body.tagIds.map((tagId: string) => ({ tagId })) }
          : undefined,
        screenshots: body.screenshots?.length
          ? {
              create: body.screenshots.map(
                (s: { url: string; caption?: string; isMain?: boolean }, i: number) => ({
                  url: s.url,
                  caption: s.caption || "",
                  order: i,
                  isMain: s.isMain || false,
                })
              ),
            }
          : undefined,
      },
      include: {
        project: true,
        category: true,
        tags: { include: { tag: true } },
        screenshots: { orderBy: { order: "asc" } },
      },
    });
    return NextResponse.json(task);
  } catch {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
