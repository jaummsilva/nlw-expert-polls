import z from "zod";
import { prisma } from "../lib/prisma";
import { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { redis } from "../lib/redis";
import { voting } from "../utils/voting-pub-sub";

export async function votePoll(app: FastifyInstance) {
  app.post("/polls/:pollId/votes", async (request, response) => {
    // Validação do Body
    const voteBody = z.object({
      pollOptionId: z.string().uuid(),
    });
    // Validação dos Parametros
    const votePollParams = z.object({
      pollId: z.string().uuid(),
    });

    const { pollId } = votePollParams.parse(request.params);
    const { pollOptionId } = voteBody.parse(request.body);

    // Cookie do usuario
    let { sessionId } = request.cookies;

    // Validar se o usuario ja votou na enquete
    if (sessionId) {
      const userPreviousVoteOnPoll = await prisma.vote.findUnique({
        where: {
          sessionId_pollId: {
            pollId,
            sessionId,
          },
        },
      });

      // Se votou em outra opção, excluir o voto antig
      if (
        userPreviousVoteOnPoll &&
        userPreviousVoteOnPoll.pollOptionId != pollOptionId
      ) {
        // Deletar
        await prisma.vote.delete({
          where: {
            id: userPreviousVoteOnPoll.id,
          },
        });

        const votesPrevious = await redis.zincrby(
          pollId,
          -1,
          userPreviousVoteOnPoll.pollOptionId
        );

        voting.publish(pollId, { pollOptionId, votes: Number(votesPrevious) });
      }

      // Se votou , retornar erro
      else if (userPreviousVoteOnPoll) {
        return response
          .status(400)
          .send({ message: "You already voted on this poll." });
      }
    }
    // Se o usuario nao votou ainda, registrar cookie
    if (!sessionId) {
      // Cookies - Segurança para o usuario votar uma unica vez
      sessionId = randomUUID();

      response.setCookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 dias,
        signed: true,
        httpOnly: true,
      });
    }

    // Criar Voto
    await prisma.vote.create({
      data: {
        sessionId,
        pollOptionId,
        pollId,
      },
    });

    const votes = await redis.zincrby(pollId, 1, pollOptionId);

    voting.publish(pollId, { pollOptionId, votes: Number(votes) });
    return response.status(201).send({ message: "Vote created success" });
  });
}
