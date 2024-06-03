import express from "express";
import { assert } from "superstruct";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../util/jwt-verify.js";

const prisma = new PrismaClient();
export const shopRouter = express.Router();

//포토카드 구매하기
shopRouter.get(`:id/purchase`, verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
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

    const {
      cardId,
      sellingQuantity,
      sellingPrice,
      wishExchangeGenre,
      wishExchangeGrade,
      wishExchageDescription
    } = req.body;
    
    const shop = await prisma.shop.create({
      data: {
        cardId,
        sellingPrice: Number(sellingPrice),
        sellerId,
        sellingQuantity: Number(sellingQuantity),
        remainingQuantity: Number(sellingQuantity),
        wishExchangeGenre,
        wishExchangeGrade,
        wishExchageDescription
      }
    });

    //등록완료했다면 내 포토카드의 정보를 수정
    const card = await prisma.card.findUnique({
      where: { id_ownerId: { id: cardId, ownerId: sellerId } }
    });
    await prisma.card.update({
      where: { id_ownerId: { id: cardId, ownerId: sellerId } },
      data: {
        availableQuantity: card.availableQuantity - Number(sellingQuantity)
      }
    });

    res.status(201).send(shop);
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});

//내 판매포토카드 수정
shopRouter.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
  } catch (e) {}
});

//상점 조회
shopRouter.get("/", verifyToken, async (req, res) => {
  try {
    const {
      page = 1,
      size = 5,
      order = "high_price",
      grade,
      genre,
      keyword
    } = req.body;
    let orderBy;
    switch (order) {
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "low_price":
        orderBy = { sellingPrice: "asc" };
        break;
      case "high_price":
        orderBy = { sellingPrice: "desc" };
        break;
    }

    const data = await prisma.shop.findMany({
      where: {
        card: {
          AND: [
            { grade },
            { genre },
            {
              OR: [
                { name: { contains: keyword } },
                { description: { contains: keyword } }
              ]
            }
          ]
        }
      },
      orderBy,
      skip: (parseInt(page) - 1) * parseInt(size),
      take: parseInt(size),

      relationLoadStrategy: "join", // or 'query'
      select: {
        sellingPrice: true,
        sellingQuantity: true,
        remainingQuantity: true,
        card: {
          select: {
            id: true,
            image: true,
            grade: true,
            genre: true,
            name: true,
            user: { select: { nickname: true } }
          }
        }
      }
    });

    const totalData = await prisma.shop.findMany({
      where: {
        card: {
          AND: [
            { grade },
            { genre },
            {
              OR: [
                { name: { contains: keyword } },
                { description: { contains: keyword } }
              ]
            }
          ]
        }
      },
      select: {
        card: true
      }
    });

    const totalCount = totalData.length;
    const totalPages = Math.ceil(totalCount / size);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const processedData = data.map((v) => {
      const card = { ...v.card };
      delete card.user;
      return {
        ...card,
        price: v.sellingPrice,
        totalQuantity: v.sellingQuantity,
        remainingQuantity: v.remainingQuantity,
        seller_nickname: v.card.user.nickname
      };
    });

    res.status(201).send({
      data: processedData,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        pageSize: size,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});

//모든 카드 가져오기
shopRouter.get("/test", async (req, res) => {
  try {
    const data = await prisma.card.findMany({});
    res.status(201).send(data);
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});
