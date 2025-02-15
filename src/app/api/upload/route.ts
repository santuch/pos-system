import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Allowed image file types
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

    // Get file extension
    const ext = path.extname(file.name).toLowerCase();

    // Check if the file type is allowed
    if (!allowedExtensions.includes(ext)) {
        return NextResponse.json(
            {
                error: "Unsupported file type. Allowed: PNG, JPG, JPEG, WEBP, SVG",
            },
            { status: 400 }
        );
    }

    // Define upload path (Next.js public folder)
    const uploadPath = path.join(process.cwd(), "public/images", file.name);

    // Convert file to Buffer and save it
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(uploadPath, buffer);

    // Return stored file path
    return NextResponse.json({ filePath: `/images/${file.name}` });
}
