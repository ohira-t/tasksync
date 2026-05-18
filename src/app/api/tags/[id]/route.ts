import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const tag = await prisma.tag.update({
    where: { id },
    data: { name: body.name, color: body.color },
  });
  return NextResponse.json(tag);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.tag.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
