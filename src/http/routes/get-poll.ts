import z from "zod";
import { prisma } from "../lib/prisma";
import { FastifyInstance } from "fastify";

export async function getPollById(app: FastifyInstance) {
  app.get("/polls/:pollId", async (request, reply) => {
    // Validação
    const getPollParams = z.object({
      pollId: z.string().uuid(),
    });

    const { pollId } = getPollParams.parse(request.params);

    const poll = await prisma.poll.findUnique({
      where: {
        id: pollId,
      },
      include: {
        options: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
    return reply.status(200).send({
      poll,
    });
  });
}
