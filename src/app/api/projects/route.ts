import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const projects = await prisma.project.findMany({
    include: { categories: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const body = await req.json();
  const maxOrder = await prisma.project.aggregate({ _max: { sortOrder: true } });
  const project = await prisma.project.create({
    data: {
      name: body.name,
      color: body.color || "#6366f1",
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
    include: { categories: true },
  });
  return NextResponse.json(project);
}
