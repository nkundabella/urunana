import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ContactMessageStatus } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Izina rirakenewe.")
    .max(100, "Izina ntigomba kurenza inyuguti 100."),
  email: z
    .string()
    .trim()
    .email("Andika imeri yemewe.")
    .max(160),
  message: z
    .string()
    .trim()
    .min(5, "Ubutumwa bugomba kuba bufite nibura inyuguti 5.")
    .max(3000, "Ubutumwa ntibugomba kurenza inyuguti 3,000."),
});

export async function contactRoutes(app: FastifyInstance) {
  // POST /api/v1/contact (public, rate-limited)
  app.post(
    "/api/v1/contact",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "10 minutes",
        },
      },
    },
    async (request, reply) => {
      const parsed = contactSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.code(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Uzuza neza izina, imeri n'ubutumwa bwawe.",
            fields: parsed.error.flatten().fieldErrors,
          },
        });
      }

      const created = await prisma.contactMessage.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email.toLowerCase(),
          message: parsed.data.message,
          status: ContactMessageStatus.NEW,
        },
      });

      return reply.code(201).send({
        ok: true,
        id: created.id,
        message: "Murakoze! Twakiriye ubutumwa bwawe.",
      });
    }
  );
}
