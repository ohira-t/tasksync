import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const projects = await prisma.project.findMany({
    include: { categories: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const body = await req.json();
  const project = await prisma.project.create({
    data: { name: body.name, color: body.color || "#6366f1" },
    include: { categories: true },
  });
  return NextResponse.json(project);
}
