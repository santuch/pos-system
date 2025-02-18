import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp", ".svg"];

export async function POST(req: Request) {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
        return NextResponse.json(
            { error: "No file uploaded" },
            { status: 400 }
        );
    }

    const ext = path.extname(file.name).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
        return NextResponse.json(
            {
                error: "Unsupported file type. Allowed: PNG, JPG, JPEG, WEBP, SVG",
            },
            { status: 400 }
        );
    }

    const uploadPath = path.join(process.cwd(), "public/images", file.name);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(uploadPath, buffer);

    return NextResponse.json({ filePath: `/images/${file.name}` });
}
