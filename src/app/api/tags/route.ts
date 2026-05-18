import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json(tags);
  } catch {
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const maxOrder = await prisma.tag.aggregate({ _max: { sortOrder: true } });
    const tag = await prisma.tag.create({
      data: {
        name: body.name,
        color: body.color || "#8b5cf6",
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });
    return NextResponse.json(tag);
  } catch {
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}
