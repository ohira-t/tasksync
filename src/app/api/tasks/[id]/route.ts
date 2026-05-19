import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const VALID_STATUSES = ["未対応", "処理中", "途中で停止中", "プルリク依頼中", "処理済み", "完了"];

function sanitizeUrl(url: string): string {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : "";
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const task = await prisma.task.update({
      where: { id },
      data: { starred: Boolean(body.starred) },
      include: {
        project: true,
        category: true,
        tags: { include: { tag: true } },
        screenshots: { orderBy: { order: "asc" } },
      },
    });
    return NextResponse.json(task);
  } catch {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.taskNumber || !body.title || !body.projectId) {
      return NextResponse.json(
        { error: "taskNumber, title, projectId are required" },
        { status: 400 }
      );
    }

    const status = VALID_STATUSES.includes(body.status) ? body.status : "未対応";

    const task = await prisma.$transaction(async (tx) => {
      await tx.taskTag.deleteMany({ where: { taskId: id } });
      await tx.screenshot.deleteMany({ where: { taskId: id } });

      return tx.task.update({
        where: { id },
        data: {
          taskNumber: body.taskNumber,
          title: body.title,
          assignee: body.assignee || "",
          status,
          description: body.description || "",
          backlogUrl: sanitizeUrl(body.backlogUrl || ""),
          startDate: body.startDate ? new Date(body.startDate) : null,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          projectId: body.projectId,
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
    });

    return NextResponse.json(task);
  } catch {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
