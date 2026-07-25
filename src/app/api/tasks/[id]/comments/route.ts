import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const comments = await prisma.comment.findMany({
      where: { taskId: id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(comments);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const text = typeof body.body === "string" ? body.body.trim() : "";
    const authorName =
      typeof body.authorName === "string" ? body.authorName.trim() : "";

    if (!text) {
      return NextResponse.json(
        { error: "body is required" },
        { status: 400 }
      );
    }
    if (!authorName) {
      return NextResponse.json(
        { error: "authorName is required" },
        { status: 400 }
      );
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: { taskId: id, body: text, authorName },
    });
    return NextResponse.json(comment);
  } catch {
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
