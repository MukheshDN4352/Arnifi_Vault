import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth/auth";
import { s3Client, BUCKET_NAME } from "@/lib/s3";
import { v4 as uuidv4 } from "uuid";

// Note: add 'uuid' to package.json dependencies if not present
// "uuid": "^9.0.1" + "@types/uuid": "^9.0.8"

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export async function POST(req: NextRequest) {
  try {
    // Auth check — admin only
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fileName, fileType, fileSize } = body;

    // Validate
    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json(
        { error: "fileName, fileType, and fileSize are required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(fileType)) {
      return NextResponse.json(
        { error: "File type not allowed. Use JPEG, PNG, WebP, or PDF." },
        { status: 400 }
      );
    }

    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 100MB." },
        { status: 400 }
      );
    }

    // Generate unique S3 key
    const ext = fileName.split(".").pop();
    const fileKey = `documents/${session.user.id}/${uuidv4()}.${ext}`;

    // Create presigned URL (valid for 5 minutes).
    // Only ContentType is signed here: the browser sends a matching Content-Type
    // header on the PUT. We deliberately omit x-amz-meta-* metadata — presigning
    // it would require the browser to echo those headers back, and it doesn't,
    // which yields a 403 SignatureDoesNotMatch. The uploader is already captured
    // in the object key (documents/<userId>/...) and in the document record.
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 minutes
    });

    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    return NextResponse.json({
      uploadUrl,
      fileKey,
      fileUrl,
    });
  } catch (error) {
    console.error("Upload URL generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
