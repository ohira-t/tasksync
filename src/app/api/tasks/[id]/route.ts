import { prisma } from "@/lib/prisma";
import {
  maskTaskScreenshots,
  screenshotIdFromProxyUrl,
} from "@/lib/screenshot-url";
import { NextResponse } from "next/server";

const VALID_STATUSES = ["未対応", "処理中", "途中で停止中", "プルリク依頼中", "処理済み", "完了"];

function sanitizeUrl(url: string): string {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : "";
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    const status = VALID_STATUSES.includes(body.status) ? body.status : "未対応";

    // クライアントには /api/images/<id> 形式のプロキシURLを渡しているため、
    // 編集保存で戻ってきたら既存レコードの実URL(blob)に解決してから保存する。
    // 実URLを持たない不正なID・URLは破棄する
    const existingShots = await prisma.screenshot.findMany({
      where: { taskId: id },
    });
    const urlById = new Map(existingShots.map((s) => [s.id, s.url]));
    const screenshots: { url: string; caption: string; isMain: boolean }[] = (
      (body.screenshots ?? []) as {
        url?: string;
        caption?: string;
        isMain?: boolean;
      }[]
    )
      .map((s) => {
        const proxyId = screenshotIdFromProxyUrl(s.url || "");
        const url = proxyId ? urlById.get(proxyId) : s.url;
        if (!url || !/^https?:\/\//i.test(url)) return null;
        return { url, caption: s.caption || "", isMain: s.isMain || false };
      })
      .filter((s): s is { url: string; caption: string; isMain: boolean } => s !== null);

    const task = await prisma.$transaction(async (tx) => {
      await tx.taskTag.deleteMany({ where: { taskId: id } });
      await tx.screenshot.deleteMany({ where: { taskId: id } });

      return tx.task.update({
        where: { id },
        data: {
          taskNumber: body.taskNumber || "",
          title: body.title,
          assignee: body.assignee || "",
          createdBy: body.createdBy || "",
          status,
          description: body.description || "",
          backlogUrl: sanitizeUrl(body.backlogUrl || ""),
          startDate: body.startDate ? new Date(body.startDate) : null,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          projectId: body.projectId || undefined,
          categoryId: body.categoryId || null,
          tags: body.tagIds?.length
            ? { create: body.tagIds.map((tagId: string) => ({ tagId })) }
            : undefined,
          screenshots: screenshots.length
            ? {
                create: screenshots.map((s, i) => ({
                  url: s.url,
                  caption: s.caption,
                  order: i,
                  isMain: s.isMain,
                })),
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

    return NextResponse.json(maskTaskScreenshots(task));
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
