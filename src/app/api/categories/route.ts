import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const category = await prisma.category.create({
    data: { name: body.name, projectId: body.projectId },
  });
  return NextResponse.json(category);
}
