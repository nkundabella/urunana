import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { env } from "../config/env.js";

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_STORY_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export type DetectedImageFormat = "jpeg" | "png" | "webp";

export function detectImageMagicBytes(buffer: Buffer): DetectedImageFormat | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "webp";
  }

  return null;
}

export class UploadValidationError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function processAndSaveImage(options: {
  buffer: Buffer;
  maxBytes: number;
  subdir: "avatars" | "stories";
  maxWidth: number;
  maxHeight?: number;
}): Promise<{ url: string; filePath: string; bytes: number }> {
  const { buffer, maxBytes, subdir, maxWidth, maxHeight } = options;

  if (buffer.length === 0) {
    throw new UploadValidationError(
      400,
      "EMPTY_FILE",
      "Hitamo ifoto yemewe mbere yo kuyohereza."
    );
  }

  if (buffer.length > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    throw new UploadValidationError(
      413,
      "FILE_TOO_LARGE",
      `Ifoto ntigomba kurenza ${mb} MB.`
    );
  }

  const detected = detectImageMagicBytes(buffer);
  if (!detected) {
    throw new UploadValidationError(
      400,
      "INVALID_IMAGE_TYPE",
      "Ubwoko bw'ifoto ntibwemewe. Koresha JPEG, PNG cyangwa WebP gusa."
    );
  }

  let outputBuffer: Buffer;
  try {
    // .rotate() honors EXIF orientation, then omitting .withMetadata() strips all EXIF/ICC tags
    outputBuffer = await sharp(buffer, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({
        width: maxWidth,
        ...(maxHeight ? { height: maxHeight } : {}),
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new UploadValidationError(
      400,
      "CORRUPT_IMAGE",
      "Ifoto yoherejwe ntishobora gusomwa. Gerageza indi foto."
    );
  }

  const targetDir = path.join(env.UPLOAD_DIR_ABS, subdir);
  await fs.mkdir(targetDir, { recursive: true });

  const fileName = `${crypto.randomUUID()}.webp`;
  const filePath = path.join(targetDir, fileName);
  await fs.writeFile(filePath, outputBuffer);

  return {
    url: `/uploads/${subdir}/${fileName}`,
    filePath,
    bytes: outputBuffer.length,
  };
}
