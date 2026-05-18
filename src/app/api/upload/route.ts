import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "png";
  const filename = `screenshots/${uuidv4()}.${ext}`;

  const blob = await put(filename, file, { access: "public" });

  return NextResponse.json({ url: blob.url });
}
