import z from "zod";
import { prisma } from "../lib/prisma";
import { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";

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

      // Se votou em outra opção, excluir o voto e criar outro
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
    const vote = await prisma.vote.create({
      data: {
        sessionId,
        pollOptionId,
        pollId,
      },
    });

    return response.status(201).send({ message: "Vote created success" });
  });
}
