import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  await prisma.taskTag.deleteMany({ where: { taskId: id } });
  await prisma.screenshot.deleteMany({ where: { taskId: id } });

  const task = await prisma.task.update({
    where: { id },
    data: {
      taskNumber: body.taskNumber,
      title: body.title,
      assignee: body.assignee || "",
      status: body.status || "未対応",
      description: body.description || "",
      backlogUrl: body.backlogUrl || "",
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
  return NextResponse.json(task);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
