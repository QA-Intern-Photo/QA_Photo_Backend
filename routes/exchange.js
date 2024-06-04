import express from "express";
import { assert } from "superstruct";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../util/jwt-verify.js";

const prisma = new PrismaClient();
export const exchangeRouter = express.Router();

//포토카드 교환 제안하기
exchangeRouter.post("/:id/exchange", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { offeredCardId, requestMessage } = req.body;
    const userId = req.decoded.userId;
    const exchangeData = await prisma.exchange.create({
      data: {
        targetCardId: id,
        offeredCardId,
        requesterId: userId,
        requestMessage
      }
    });

    //내 카드의 availableQuantity 수정
    const card = await prisma.card.findUnique({
      where: { id_ownerId: { id: offeredCardId, ownerId: userId } }
    });
    await prisma.card.update({
      where: { id_ownerId: { id: offeredCardId, ownerId: userId } },
      data: { availableQuantity: card.availableQuantity - 1 }
    });
    res.status(201).send(exchangeData);
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});

exchangeRouter.delete("");
