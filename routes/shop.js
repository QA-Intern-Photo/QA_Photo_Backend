import express from "express";
import { assert } from "superstruct";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../util/jwt-verify.js";

const prisma = new PrismaClient();
export const shopRouter = express.Router();

//포토카드 구매하기
shopRouter.get(`/purchase`, verifyToken, async (req, res) => {
  try {
    const { email, nickname, points, createdAt, updatedAt } =
      await prisma.shop.findUnique({
        where: { id }
      });
    return res
      .status(201)
      .send({ email, nickname, points, createdAt, updatedAt });
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});

//내 포토카드 판매하기
shopRouter.post("/", verifyToken, async (req, res) => {
  try {
    const sellerId = req.decoded.userId;

    const { cardId, sellingQuantity, sellingPrice } = req.body;
    const shop = await prisma.shop.create({
      data: {
        cardId,
        sellingPrice: Number(sellingPrice),
        sellerId
      }
    });

    //등록완료했다면 내 포토카드의 정보를 수정
    const card = await prisma.card.findUnique({
      where: { id_ownerId: { id: cardId, ownerId: sellerId } }
    });
    await prisma.card.update({
      where: { id_ownerId: { id: cardId, ownerId: sellerId } },
      data: {
        remainingQuantity:
          card.totalQuantity -
          Number(sellingQuantity) -
          card.exchangingQuantity,
        status: "SALE",
        sellingQuantity: Number(sellingQuantity)
      }
    });

    res.status(201).send(shop);
  } catch (e) {
    if (e.code === "P2002")
      return res.status(409).send({ message: "이미 판매중인 카드입니다." });
    return res.status(500).send({ message: e.message });
  }
});
