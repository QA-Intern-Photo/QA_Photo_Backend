import express from "express";
import { assert } from "superstruct";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../util/jwt-verify.js";
import { getOrderBy } from "../util/get-order-by.js";

const prisma = new PrismaClient();
export const shopRouter = express.Router();

//포토카드 구매하기
shopRouter.post("/:shopId/purchase", verifyToken, async (req, res) => {
  try {
    const { shopId } = req.params;
    const { purchaseQuantity } = req.body;
    const userId = req.decoded.userId;

    const shopData = await prisma.shop.findUnique({
      where: { id: shopId }
    });

    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true, nickname: true }
    });

    if (userData.points - shopData.sellingPrice * purchaseQuantity < 0)
      throw new Error("포인트가 부족합니다.");

    //구매후 유저의 포인트 감소
    await prisma.user.update({
      where: { id: userId },
      data: {
        points: userData.points - shopData.sellingPrice * purchaseQuantity
      }
    });

    //구매 후 판매자의 포인트 증가
    const sellerData = await prisma.user.findUnique({
      where: { id: shopData.sellerId },
      select: {
        points: true
      }
    });
    await prisma.user.update({
      where: { id: shopData.sellerId },
      data: {
        points: sellerData.points + shopData.sellingPrice * purchaseQuantity
      }
    });

    //구매자에게 해당 카드 추가
    let purchaseCardData;
    const sameCard = await prisma.card.findUnique({
      where: {
        id_ownerId: { id: shopData.cardId, ownerId: userId }
      }
    });
    //만약 이미 갖고 있던 카드라면 수량을 업데이트
    if (sameCard) {
      purchaseCardData = await prisma.card.update({
        where: {
          id_ownerId: { id: shopData.cardId, ownerId: userId }
        },
        data: {
          totalQuantity: sameCard.totalQuantity + purchaseQuantity,
          availableQuantity: sameCard.availableQuantity + purchaseQuantity,
          price: shopData.sellingPrice
        }
      });
    } else {
      //처음 갖게된 카드라면 새로 추가
      const cardData = await prisma.card.findFirst({
        where: { id: shopData.cardId }
      });
      purchaseCardData = await prisma.card.create({
        data: {
          id: shopData.cardId,
          ownerId: userId,
          totalQuantity: purchaseQuantity,
          availableQuantity: purchaseQuantity,
          image: cardData.image,
          name: cardData.name,
          grade: cardData.grade,
          genre: cardData.genre,
          description: cardData.description,
          price: shopData.sellingPrice
        }
      });
    }

    await prisma.shop.update({
      where: { id: shopId },
      data: { remainingQuantity: shopData.remainingQuantity - purchaseQuantity }
    });

    //구매 성공 알림 보내기
    await prisma.notification.create({
      data: {
        userId,
        content: `[${purchaseCardData.grade}|${purchaseCardData.name}]${purchaseQuantity}장을 성공적으로 구매했습니다.`
      }
    });

    //판매 알림 보내기
    await prisma.notification.create({
      data: {
        userId: shopData.sellerId,
        content: `${userData.nickname}님이 [${purchaseCardData.grade}|${purchaseCardData.name}]을(를) ${purchaseQuantity}장 구매했습니다.`
      }
    });

    //품절이라면 품절알람 보내기
    if (shopData.remainingQuantity - purchaseQuantity === 0)
      await prisma.notification.create({
        data: {
          userId: shopData.sellerId,
          content: `[${purchaseCardData.grade}|${purchaseCardData.name}]이(가) 품절되었습니다.`
        }
      });
    return res.status(201).send(purchaseCardData);
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
    const userId = req.decoded.userId;
    const body = { ...req.body };

    const shopData = await prisma.shop.findUnique({
      where: { id: shopId }
    });

    if (shopData.sellerId !== userId) throw new Error("수정 권한이 없습니다.");

    if (req.body.sellingQuantity === shopData.remainingQuantity) {
      delete body.sellingQuantity;
    } else {
      const cardData = await prisma.card.findUnique({
        where: {
          id_ownerId: { id: shopData.cardId, ownerId: userId }
        }
      });

      await prisma.card.update({
        where: {
          id_ownerId: { id: shopData.cardId, ownerId: userId }
        },
        data: {
          availableQuantity:
            cardData.availableQuantity +
            (shopData.remainingQuantity - req.body.sellingQuantity)
        }
      });

      body.sellingQuantity =
        shopData.sellingQuantity +
        (req.body.sellingQuantity - shopData.remainingQuantity);
      body.remainingQuantity = req.body.sellingQuantity;
    }
    const newShopData = await prisma.shop.update({
      where: { id: shopId },
      data: {
        ...body
      }
    });
    res.status(200).send(newShopData);
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});

//내 판매포토카드 삭제
shopRouter.delete("/:shopId", verifyToken, async (req, res) => {
  try {
    const { shopId } = req.params;

    const shopData = await prisma.shop.findUnique({
      where: { id: shopId }
    });
    if (shopData.sellerId !== req.decoded.userId)
      throw new Error("삭제 권한이 없습니다.");

    //삭제 후 remainingQuantity만큼 원래 카드수량 추가하기
    const cardData = await prisma.card.findUnique({
      where: {
        id_ownerId: { id: shopData.cardId, ownerId: shopData.sellerId }
      },
      select: { availableQuantity: true }
    });
    await prisma.card.update({
      where: {
        id_ownerId: { id: shopData.cardId, ownerId: shopData.sellerId }
      },
      data: {
        availableQuantity:
          cardData.availableQuantity + shopData.remainingQuantity
      }
    });

    //교환 신청 온 카드들 다 거절처리
    const exchangeData = await prisma.exchange.findMany({
      where: { targetCardId: shopId }
    });
    exchangeData.map(async (v) => {
      const card = await prisma.card.findUnique({
        where: {
          id_ownerId: {
            id: v.offeredCardId,
            ownerId: v.requesterId
          }
        }
      });
      await prisma.card.update({
        where: { id_ownerId: { id: card.id, ownerId: card.ownerId } },
        data: { availableQuantity: card.availableQuantity + 1 }
      });
    });

    //shop data 먼저 삭제하면 exchange 수량 반영 전에 cascade로 삭제되므로 마지막에 삭제
    await prisma.shop.delete({
      where: { id: shopId }
    });
    res.status(204).send({ message: "삭제 성공" });
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
      order = "newest",
      grade,
      genre,
      keyword,
      isSoldOut
    } = req.query;

    let whereIsSoldOut = { remainingQuantity: { gt: 0 } };
    if (isSoldOut === "true") {
      whereIsSoldOut = { remainingQuantity: 0 };
    }
    if (!("isSoldOut" in req.query)) whereIsSoldOut = {};

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

    res.status(200).send({
      data: processedData,
      pagination: {
        totalCount,
        totalPages,
        currentPage: Number(page),
        pageSize: Number(size),
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
        wishExchageDescription: true,
        wishExchangeGenre: true,
        wishExchangeGrade: true,
        card: {
          select: {
            image: true,
            grade: true,
            genre: true,
            name: true,
            description: true,
            availableQuantity: true,
            user: { select: { nickname: true } }
          }
        }
      }
    });
    const seller_nickname = data.card.user.nickname;
    const availableQuantity = data.card.availableQuantity;
    delete data.card.user;
    delete data.card.availableQuantity;
    const processedData = {
      id,
      ...data.card,
      price: data.sellingPrice,
      totalQuantity: data.sellingQuantity,
      remainingQuantity: data.remainingQuantity,
      seller_nickname,
      isOwner: false,
      wishExchangeData: {
        wishExchangeDescription: data.wishExchageDescription,
        wishExchangeGenre: data.wishExchangeGenre,
        wishExchangeGrade: data.wishExchangeGrade
      }
    };

    let exchangeCardData;
    //해당 카드 판매자라면 받은 교환제시 조회
    if (data.sellerId == req.decoded.userId) {
      processedData.isOwner = true;
      //maxSellingQuantity데이터 추가
      processedData.maxSellingQuantity =
        availableQuantity + data.remainingQuantity;

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

    res.status(200).send({
      ...processedData,
      exchangeRequest
    });
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});
