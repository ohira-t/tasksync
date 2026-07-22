import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const members = await prisma.member.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(members);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const existing = await prisma.member.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { error: "同じ名前のメンバーが既に登録されています" },
        { status: 409 }
      );
    }
    const maxOrder = await prisma.member.aggregate({ _max: { sortOrder: true } });
    const member = await prisma.member.create({
      data: {
        name,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });
    return NextResponse.json(member);
  } catch {
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 }
    );
  }
}
