import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Shared S3 client. The bucket is private — objects are never publicly
// readable, so files must be served through short-lived presigned URLs
// (both for upload, see /api/upload, and for viewing, see /api/files/view).
export const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

// Presigned GET URL for viewing/downloading a stored object. Valid for 5
// minutes — long enough to open, short enough to keep links from leaking.
export function getViewUrl(fileKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 300 });
}
