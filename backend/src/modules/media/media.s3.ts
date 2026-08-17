import fs from "node:fs";
import { Readable } from "node:stream";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env, isTest } from "@common/config/env";
import { s3ObjectKey } from "./media.storage";

type S3SendOptions = {
  abortSignal?: AbortSignal;
};

type S3Sender = {
  send: (command: unknown, options?: S3SendOptions) => Promise<unknown>;
};

let client: S3Sender | undefined;

export function setMediaS3Client(value?: S3Sender) {
  client = value;
}

function s3(): S3Sender {
  client ??= new S3Client({
    region: env.AWS_REGION,
    maxAttempts: 1,
  }) as S3Sender;
  return client;
}

// Keep this well under CloudFront's 30s origin timeout. A hung PutObject used to
// hold the Studio upload until the CDN returned the SPA HTML (HTTP 200).
const S3_TIMEOUT_MS = isTest ? 200 : 8000;

async function sendWithTimeout(command: unknown) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      s3().send(command, { abortSignal: controller.signal }),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error("s3_timeout"));
        }, S3_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function bucketName() {
  const bucket = env.S3_UPLOADS_BUCKET;
  if (!bucket) {
    throw new Error("S3_UPLOADS_BUCKET is not set");
  }
  return bucket;
}

function isS3NotFound(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }
  const name = "name" in error ? String(error.name) : "";
  const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
  return name === "NoSuchKey" || name === "NotFound" || status === 404;
}

async function asReadable(body: unknown): Promise<Readable> {
  if (body instanceof Readable) {
    return body;
  }
  if (
    body &&
    typeof body === "object" &&
    typeof (body as { transformToByteArray?: unknown }).transformToByteArray === "function"
  ) {
    const bytes = await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
    return Readable.from(Buffer.from(bytes));
  }
  throw new Error("S3 object body is not readable");
}

export async function putMediaObject(filename: string, filePath: string, contentType: string) {
  const body = await fs.promises.readFile(filePath);
  await sendWithTimeout(
    new PutObjectCommand({
      Bucket: bucketName(),
      Key: s3ObjectKey(filename),
      Body: body,
      ContentLength: body.length,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function getMediaObject(filename: string) {
  try {
    const output = (await sendWithTimeout(
      new GetObjectCommand({
        Bucket: bucketName(),
        Key: s3ObjectKey(filename),
      }),
    )) as {
      Body?: unknown;
      ContentType?: string;
      ContentLength?: number;
    };
    if (!output.Body) {
      return null;
    }
    return {
      body: await asReadable(output.Body),
      contentType: output.ContentType,
      contentLength: output.ContentLength,
    };
  } catch (error) {
    if (isS3NotFound(error)) {
      return null;
    }
    throw error;
  }
}
