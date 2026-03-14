import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { requireAuthUser } from "@/lib/auth-context";

export async function POST(request: Request) {
  try {
    await requireAuthUser({ requireCompany: true });

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "rfq-items");
    await fs.mkdir(uploadDir, { recursive: true });

    const ext =
      (file.type && file.type.split("/")[1]) ||
      (file.name && file.name.split(".").pop()) ||
      "png";
    const filename = `${randomUUID()}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    await fs.writeFile(filepath, buffer);

    const url = `/uploads/rfq-items/${filename}`;

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

