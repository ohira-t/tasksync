import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function normalizeAndSwap(
  type: "project" | "category" | "tag",
  id: string,
  direction: "up" | "down",
) {
  if (type === "project") {
    const items = await prisma.project.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
    for (let i = 0; i < items.length; i++) {
      if (items[i].sortOrder !== i) {
        await prisma.project.update({ where: { id: items[i].id }, data: { sortOrder: i } });
      }
    }
    const idx = items.findIndex((item) => item.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    await prisma.$transaction([
      prisma.project.update({ where: { id: items[idx].id }, data: { sortOrder: swapIdx } }),
      prisma.project.update({ where: { id: items[swapIdx].id }, data: { sortOrder: idx } }),
    ]);
  } else if (type === "category") {
    const current = await prisma.category.findUnique({ where: { id } });
    if (!current) return;
    const items = await prisma.category.findMany({
      where: { projectId: current.projectId },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    for (let i = 0; i < items.length; i++) {
      if (items[i].sortOrder !== i) {
        await prisma.category.update({ where: { id: items[i].id }, data: { sortOrder: i } });
      }
    }
    const idx = items.findIndex((item) => item.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    await prisma.$transaction([
      prisma.category.update({ where: { id: items[idx].id }, data: { sortOrder: swapIdx } }),
      prisma.category.update({ where: { id: items[swapIdx].id }, data: { sortOrder: idx } }),
    ]);
  } else if (type === "tag") {
    const items = await prisma.tag.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
    for (let i = 0; i < items.length; i++) {
      if (items[i].sortOrder !== i) {
        await prisma.tag.update({ where: { id: items[i].id }, data: { sortOrder: i } });
      }
    }
    const idx = items.findIndex((item) => item.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    await prisma.$transaction([
      prisma.tag.update({ where: { id: items[idx].id }, data: { sortOrder: swapIdx } }),
      prisma.tag.update({ where: { id: items[swapIdx].id }, data: { sortOrder: idx } }),
    ]);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, id, direction } = body as {
      type: "project" | "category" | "tag";
      id: string;
      direction: "up" | "down";
    };

    if (!["project", "category", "tag"].includes(type) || !id || !["up", "down"].includes(direction)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    await normalizeAndSwap(type, id, direction);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}
