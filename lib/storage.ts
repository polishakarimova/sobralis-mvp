import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import crypto from "node:crypto";

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error("Хранилище изображений ещё не подключено");
  return value;
}

function getStorageConfig() {
  const endpoint = requiredEnv("S3_ENDPOINT");
  const region = process.env.S3_REGION || "us-east-1";
  const bucket = requiredEnv("S3_BUCKET");
  const accessKeyId = requiredEnv("S3_ACCESS_KEY_ID");
  const secretAccessKey = requiredEnv("S3_SECRET_ACCESS_KEY");
  const publicBaseUrl = (process.env.S3_PUBLIC_BASE_URL || `${endpoint.replace(/\/$/, "")}/${bucket}`).replace(/\/$/, "");

  return { endpoint, region, bucket, accessKeyId, secretAccessKey, publicBaseUrl };
}

function extensionForContentType(contentType: string) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}

export function assertImageUpload(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Можно загрузить только JPG, PNG или WEBP");
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Изображение должно быть меньше 8 МБ");
  }
}

export async function uploadEventImage(file: File, userId: string) {
  assertImageUpload(file);

  const config = getStorageConfig();
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  const extension = extensionForContentType(file.type);
  const key = `event-images/${userId}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  const body = Buffer.from(await file.arrayBuffer());

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return {
    key,
    url: `${config.publicBaseUrl}/${key}`,
  };
}
