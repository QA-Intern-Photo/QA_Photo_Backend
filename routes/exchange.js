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

    //제안 알림보내기
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: { nickname: true }
    });
    const shopData = await prisma.shop.findUnique({
      where: { id },
      select: {
        sellerId: true,
        card: {
          select: {
            grade: true,
            name: true
          }
        }
      }
    });
    await prisma.notification.create({
      data: {
        userId: shopData.sellerId,
        content: `${userData.nickname}님이 [${shopData.card.grade}|${shopData.card.name}]의 포토카드 교환을 제안했습니다.`
      }
    });
    res.status(201).send(exchangeData);
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});

//교환 취소하기
exchangeRouter.delete("/:id/exchange", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.decoded.userId;

    const deletedData = await prisma.exchange.delete({
      where: { id }
    });

    //교환 취소했다면 내 카드의 availableQuantity 수정
    const card = await prisma.card.findUnique({
      where: { id_ownerId: { id: deletedData.offeredCardId, ownerId: userId } }
    });
    await prisma.card.update({
      where: { id_ownerId: { id: card.id, ownerId: userId } },
      data: { availableQuantity: card.availableQuantity + 1 }
    });
    return res.status(204).send({ message: "삭제 성공" });
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});

//교환 거절하기
exchangeRouter.post("/:id/exchange/refuse", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedData = await prisma.exchange.delete({
      where: { id }
    });

    const card = await prisma.card.findUnique({
      where: {
        id_ownerId: {
          id: deletedData.offeredCardId,
          ownerId: deletedData.requesterId
        }
      }
    });
    await prisma.card.update({
      where: { id_ownerId: { id: card.id, ownerId: card.ownerId } },
      data: { availableQuantity: card.availableQuantity + 1 }
    });

    //교환 거절 알림 보내기
    const shopData = await prisma.shop.findUnique({
      where: { id: deletedData.targetCardId },
      select: {
        cardId: true,
        card: {
          select: {
            grade: true,
            name: true,
            user: { select: { nickname: true } }
          }
        }
      }
    });
    await prisma.notification.create({
      data: {
        userId: deletedData.requesterId,
        content: `${shopData.card.user.nickname}님과의 [${shopData.card.grade}|${shopData.card.name}]의 표토카드 교환이 불발되었습니다.`
      }
    });
    res.status(201).send(deletedData);
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});

//교환 승인하기
exchangeRouter.post("/:id/exchange/accept", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.decoded.userId;

    const exchangeCard = await prisma.exchange.findUnique({
      where: { id }
    });

    //상점에서 교환한 카드 수량 1개 줄이기
    const shopCard = await prisma.shop.findUnique({
      where: { id: exchangeCard.targetCardId }
    });
    if (shopCard.sellerId !== userId) {
      throw new Error("승인 권한이 없습니다.");
    }
    if (shopCard.remainingQuantity < 0) {
      throw new Error("해당 카드는 매진되었습니다.");
    }
    await prisma.shop.update({
      where: { id: shopCard.id },
      data: { remainingQuantity: shopCard.remainingQuantity - 1 }
    });

    //교환 제시한 유저에게 해당 카드 추가
    const sameCard = await prisma.card.findUnique({
      where: {
        id_ownerId: { id: shopCard.cardId, ownerId: exchangeCard.requesterId }
      }
    });
    //만약 이미 갖고 있던 카드라면 수량을 업데이트
    if (sameCard) {
      await prisma.card.update({
        where: {
          id_ownerId: { id: shopCard.cardId, ownerId: exchangeCard.requesterId }
        },
        data: {
          totalQuantity: sameCard.totalQuantity + 1,
          availableQuantity: sameCard.availableQuantity + 1,
          price: shopCard.sellingPrice
        }
      });
    } else {
      //처음 갖게된 카드라면 새로 추가
      const cardData = await prisma.card.findFirst({
        where: { id: shopCard.cardId }
      });
      await prisma.card.create({
        data: {
          id: shopCard.cardId,
          ownerId: exchangeCard.requesterId,
          totalQuantity: 1,
          availableQuantity: 1,
          image: cardData.image,
          name: cardData.name,
          grade: cardData.grade,
          genre: cardData.genre,
          description: cardData.description,
          price: shopCard.sellingPrice
        }
      });
    }

    //교환 승인한 유저에게 교환제안카드 추가
    const sameCard2 = await prisma.card.findUnique({
      where: {
        id_ownerId: {
          id: exchangeCard.offeredCardId,
          ownerId: userId
        }
      }
    });

    //만약 이미 갖고 있던 카드라면 수량을 업데이트
    if (sameCard2) {
      await prisma.card.update({
        where: {
          id_ownerId: { id: exchangeCard.offeredCardId, ownerId: userId }
        },
        data: {
          totalQuantity: sameCard2.totalQuantity + 1,
          availableQuantity: sameCard2.availableQuantity + 1
        }
      });
    } else {
      //처음 갖게된 카드라면 새로 추가
      const cardData = await prisma.card.findUnique({
        where: {
          id_ownerId: {
            id: exchangeCard.offeredCardId,
            ownerId: exchangeCard.requesterId
          }
        }
      });
      await prisma.card.create({
        data: {
          id: exchangeCard.offeredCardId,
          ownerId: userId,
          totalQuantity: 1,
          availableQuantity: 1,
          image: cardData.image,
          name: cardData.name,
          grade: cardData.grade,
          genre: cardData.genre,
          description: cardData.description,
          price: cardData.price
        }
      });
    }

    //판매자의 카드 totalQuantity 1만큼 감소
    const sellerCardData = await prisma.card.findUnique({
      where: {
        id_ownerId: { id: shopCard.cardId, ownerId: shopCard.sellerId }
      },
      select: { totalQuantity: true }
    });
    await prisma.card.update({
      where: {
        id_ownerId: { id: shopCard.cardId, ownerId: shopCard.sellerId }
      },
      data: { totalQuantity: sellerCardData.totalQuantity - 1 }
    });

    //교환제시자의 카드 totalQuantity 1만큼 감소
    const requesterCardData = await prisma.card.findUnique({
      where: {
        id_ownerId: {
          id: exchangeCard.offeredCardId,
          ownerId: exchangeCard.requesterId
        }
      },
      select: { totalQuantity: true }
    });
    await prisma.card.update({
      where: {
        id_ownerId: {
          id: exchangeCard.offeredCardId,
          ownerId: exchangeCard.requesterId
        }
      },
      data: { totalQuantity: requesterCardData.totalQuantity - 1 }
    });

    //모든 교환이 성공적으로 이뤄졌다면 exchange 데이터베이스에서 삭제
    await prisma.exchange.delete({ where: { id } });

    //교환 승인 알림 보내기
    const shopData = await prisma.shop.findUnique({
      where: { id: exchangeCard.targetCardId },
      select: {
        cardId: true,
        card: {
          select: {
            grade: true,
            name: true,
            user: { select: { nickname: true } }
          }
        }
      }
    });
    await prisma.notification.create({
      data: {
        userId: exchangeCard.requesterId,
        content: `${shopData.card.user.nickname}님과의 [${shopData.card.grade}|${shopData.card.name}]의 표토카드 교환이 성사되었습니다.`
      }
    });

    res.status(201).send({ message: "교환 성공" });
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});
