import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const maxOrder = await prisma.category.aggregate({
    where: { projectId: body.projectId },
    _max: { sortOrder: true },
  });
  const category = await prisma.category.create({
    data: {
      name: body.name,
      projectId: body.projectId,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  return NextResponse.json(category);
}
