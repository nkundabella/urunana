import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  MAX_AVATAR_BYTES,
  MAX_STORY_IMAGE_BYTES,
  processAndSaveImage,
  UploadValidationError,
} from "../../lib/upload.js";
import { requireAuth } from "../../plugins/auth-guard.js";

async function readSingleFileBuffer(
  request: FastifyRequest,
  maxBytes: number
): Promise<Buffer> {
  let file;
  try {
    file = await request.file({
      limits: {
        fileSize: maxBytes,
        files: 1,
      },
    });
  } catch (err: unknown) {
    const code = (err as { code?: string } | null)?.code;
    if (code === "FST_REQ_FILE_TOO_LARGE") {
      const mb = Math.round(maxBytes / (1024 * 1024));
      throw new UploadValidationError(
        413,
        "FILE_TOO_LARGE",
        `Ifoto ntigomba kurenza ${mb} MB.`
      );
    }
    throw new UploadValidationError(
      400,
      "INVALID_MULTIPART",
      "Ohereza ifoto ukoresheje multipart/form-data."
    );
  }

  if (!file) {
    throw new UploadValidationError(
      400,
      "MISSING_FILE",
      "Nta foto yatoranyijwe."
    );
  }

  let buffer: Buffer;
  try {
    buffer = await file.toBuffer();
  } catch (err: unknown) {
    const code = (err as { code?: string } | null)?.code;
    if (code === "FST_REQ_FILE_TOO_LARGE" || file.file.truncated) {
      const mb = Math.round(maxBytes / (1024 * 1024));
      throw new UploadValidationError(
        413,
        "FILE_TOO_LARGE",
        `Ifoto ntigomba kurenza ${mb} MB.`
      );
    }
    throw err;
  }

  if (file.file.truncated || buffer.length > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    throw new UploadValidationError(
      413,
      "FILE_TOO_LARGE",
      `Ifoto ntigomba kurenza ${mb} MB.`
    );
  }

  return buffer;
}

function handleUploadError(err: unknown, reply: FastifyReply) {
  if (err instanceof UploadValidationError) {
    return reply.code(err.status).send({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }
  const code = (err as { code?: string } | null)?.code;
  if (code === "FST_REQ_FILE_TOO_LARGE") {
    return reply.code(413).send({
      error: {
        code: "FILE_TOO_LARGE",
        message: "Ifoto irengeje ubunini bwemewe.",
      },
    });
  }
  throw err;
}

export async function uploadsRoutes(app: FastifyInstance) {
  // POST /api/v1/uploads/avatar (<= 2 MB, resized <= 512x512 .webp)
  app.post(
    "/api/v1/uploads/avatar",
    {
      preHandler: requireAuth,
      config: { rateLimit: { max: 20, timeWindow: "10 minutes" } },
    },
    async (request, reply) => {
      try {
        const buffer = await readSingleFileBuffer(request, MAX_AVATAR_BYTES);
        const saved = await processAndSaveImage({
          buffer,
          maxBytes: MAX_AVATAR_BYTES,
          subdir: "avatars",
          maxWidth: 512,
          maxHeight: 512,
        });
        return reply.code(201).send({ url: saved.url, bytes: saved.bytes });
      } catch (err) {
        return handleUploadError(err, reply);
      }
    }
  );

  // POST /api/v1/uploads/story-image (<= 5 MB, resized <= 1600px wide .webp)
  app.post(
    "/api/v1/uploads/story-image",
    {
      preHandler: requireAuth,
      config: { rateLimit: { max: 30, timeWindow: "10 minutes" } },
    },
    async (request, reply) => {
      try {
        const buffer = await readSingleFileBuffer(
          request,
          MAX_STORY_IMAGE_BYTES
        );
        const saved = await processAndSaveImage({
          buffer,
          maxBytes: MAX_STORY_IMAGE_BYTES,
          subdir: "stories",
          maxWidth: 1600,
        });
        return reply.code(201).send({ url: saved.url, bytes: saved.bytes });
      } catch (err) {
        return handleUploadError(err, reply);
      }
    }
  );
}
