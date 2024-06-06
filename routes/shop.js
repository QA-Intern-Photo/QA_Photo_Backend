import express from "express";
import { assert } from "superstruct";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../util/jwt-verify.js";
import { getOrderBy } from "../util/get-order-by.js";

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
shopRouter.put("/:shopId", verifyToken, async (req, res) => {
  try {
    const { shopId } = req.params;
  } catch (e) {}
});

//내 판매포토카드 삭제
shopRouter.delete("/:shopId", verifyToken, async (req, res) => {
  try {
    const { shopId } = req.params;

    const shopData = await prisma.shop.delete({
      where: { id: shopId }
    });

    console.log(shopData);
    res.status(201).send({ message: "삭제 성공" });
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});

//상점 조회
shopRouter.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      size = 5,
      order = "high_price",
      grade,
      genre,
      keyword,
      isSoldOut
    } = req.body;

    let whereIsSoldOut = { remainingQuantity: { gt: 0 } };
    if (isSoldOut) {
      whereIsSoldOut = { remainingQuantity: 0 };
    }

    const data = await prisma.shop.findMany({
      where: {
        ...whereIsSoldOut,
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
      orderBy: getOrderBy(order),
      skip: (parseInt(page) - 1) * parseInt(size),
      take: parseInt(size),

      relationLoadStrategy: "join", // or 'query'
      select: {
        id: true,
        sellingPrice: true,
        sellingQuantity: true,
        remainingQuantity: true,
        card: {
          select: {
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
        id: v.id,
        ...card,
        price: v.sellingPrice,
        totalQuantity: v.sellingQuantity,
        remainingQuantity: v.remainingQuantity,
        isSoldOut: !Boolean(v.remainingQuantity),
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

//상점 상세 조회
shopRouter.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.shop.findUnique({
      where: { id },
      select: {
        id: true,
        sellerId: true,
        sellingPrice: true,
        sellingQuantity: true,
        remainingQuantity: true,
        card: {
          select: {
            image: true,
            grade: true,
            genre: true,
            name: true,
            user: { select: { nickname: true } }
          }
        }
      }
    });
    const seller_nickname = data.card.user.nickname;
    delete data.card.user;
    const processedData = {
      ...data.card,
      price: data.sellingPrice,
      totalQuantity: data.sellingQuantity,
      remainingQuantity: data.remainingQuantity,
      seller_nickname,
      isOwner: false
    };

    let exchangeCardData;
    //해당 카드 판매자라면 받은 교환제시 조회
    if (data.sellerId == req.decoded.userId) {
      processedData.isOwner = true;

      exchangeCardData = await prisma.exchange.findMany({
        where: {
          targetCardId: id
        },
        select: {
          id: true,
          requestMessage: true,
          card: {
            select: {
              image: true,
              grade: true,
              genre: true,
              name: true,
              price: true,
              user: { select: { nickname: true } }
            }
          }
        }
      });
    } else {
      //해당 카드의 판매자가 아니라면 내가 교환제시한 목록 조회
      exchangeCardData = await prisma.exchange.findMany({
        where: {
          targetCardId: id,
          requesterId: req.decoded.userId
        },
        select: {
          id: true,
          requestMessage: true,
          card: {
            select: {
              image: true,
              grade: true,
              genre: true,
              name: true,
              price: true,
              user: { select: { nickname: true } }
            }
          }
        }
      });
    }

    const exchangeRequest = exchangeCardData.map((v) => {
      const card = { ...v.card };
      delete card.user;
      return {
        exchangeId: v.id,
        ...card,
        nickname: v.card.user.nickname,
        requestMessage: v.requestMessage
      };
    });

    res.status(201).send({
      ...processedData,
      exchangeRequest
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
