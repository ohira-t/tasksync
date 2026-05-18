import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
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
}

export async function POST(req: Request) {
  const body = await req.json();
  const task = await prisma.task.create({
    data: {
      taskNumber: body.taskNumber,
      title: body.title,
      assignee: body.assignee || "",
      status: body.status || "未対応",
      description: body.description || "",
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
              (s: { url: string; caption?: string }, i: number) => ({
                url: s.url,
                caption: s.caption || "",
                order: i,
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
