import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.projectId) {
      return NextResponse.json({ error: "name and projectId are required" }, { status: 400 });
    }
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
  } catch {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
