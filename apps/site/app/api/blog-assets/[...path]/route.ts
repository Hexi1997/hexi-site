import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".json": "application/json",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".md": "text/markdown",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    // Build file path: posts/[...path]
    const filePath = path.join(
      process.cwd(),
      "posts",
      ...pathSegments
    );

    // Security check: ensure path is within posts directory
    const contentDir = path.join(process.cwd(), "posts");
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(contentDir)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check if it's a file
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return NextResponse.json({ error: "Not a file" }, { status: 400 });
    }

    // Read file
    const fileBuffer = fs.readFileSync(filePath);

    // Get file extension and set Content-Type
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    // Return file content
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour in dev
      },
    });
  } catch (error) {
    console.error("Error serving blog asset:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

