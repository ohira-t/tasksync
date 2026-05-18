import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { type, id, direction } = body as {
    type: "project" | "category" | "tag";
    id: string;
    direction: "up" | "down";
  };

  if (type === "project") {
    const current = await prisma.project.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const neighbor = await prisma.project.findFirst({
      where: {
        sortOrder: direction === "up"
          ? { lt: current.sortOrder }
          : { gt: current.sortOrder },
      },
      orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    });

    if (neighbor) {
      await prisma.$transaction([
        prisma.project.update({ where: { id: current.id }, data: { sortOrder: neighbor.sortOrder } }),
        prisma.project.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder } }),
      ]);
    }
  } else if (type === "category") {
    const current = await prisma.category.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const neighbor = await prisma.category.findFirst({
      where: {
        projectId: current.projectId,
        sortOrder: direction === "up"
          ? { lt: current.sortOrder }
          : { gt: current.sortOrder },
      },
      orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    });

    if (neighbor) {
      await prisma.$transaction([
        prisma.category.update({ where: { id: current.id }, data: { sortOrder: neighbor.sortOrder } }),
        prisma.category.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder } }),
      ]);
    }
  } else if (type === "tag") {
    const current = await prisma.tag.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const neighbor = await prisma.tag.findFirst({
      where: {
        sortOrder: direction === "up"
          ? { lt: current.sortOrder }
          : { gt: current.sortOrder },
      },
      orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    });

    if (neighbor) {
      await prisma.$transaction([
        prisma.tag.update({ where: { id: current.id }, data: { sortOrder: neighbor.sortOrder } }),
        prisma.tag.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder } }),
      ]);
    }
  }

  return NextResponse.json({ ok: true });
}
