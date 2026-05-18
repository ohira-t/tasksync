import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const tags = await prisma.tag.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(tags);
}

export async function POST(req: Request) {
  const body = await req.json();
  const maxOrder = await prisma.tag.aggregate({ _max: { sortOrder: true } });
  const tag = await prisma.tag.create({
    data: {
      name: body.name,
      color: body.color || "#8b5cf6",
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  return NextResponse.json(tag);
}
