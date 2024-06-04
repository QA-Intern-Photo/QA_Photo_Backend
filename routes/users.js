import express from "express";
import { CreateCard } from "../structs.js";
import { assert } from "superstruct";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../util/jwt-verify.js";
import { upload } from "../util/upload-image.js";
const prisma = new PrismaClient();
export const userRouter = express.Router();

//내 카드 등록
userRouter.post(
  "/my-cards",
  verifyToken,
  upload.single("image"),
  async (req, res) => {
    try {
      assert(req.body, CreateCard);
      const { name, price, grade, genre, description, totalQuantity } =
        req.body;
      const card = await prisma.card.create({
        data: {
          ownerId: req.decoded.userId,
          availableQuantity: Number(req.body.totalQuantity),
          image: req.file.location,
          name,
          price: Number(price),
          grade,
          genre,
          description,
          totalQuantity: Number(totalQuantity)
        }
      });
      delete card.ownerId;
      return res.status(201).send(card);
    } catch (e) {
      return res.status(500).send({ message: e.message });
    }
  }
);

//내 카드 조회
userRouter.get("/my-cards", verifyToken, async (req, res) => {
  try {
    const {
      page = 1,
      size = 5,
      order = "high_price",
      grade,
      genre,
      keyword
    } = req.body;

    const data = await prisma.card.findMany({
      where: {
        AND: [
          { genre },
          { grade },
          {
            OR: [
              { name: { contains: keyword } },
              { description: { contains: keyword } }
            ]
          },
          {
            availableQuantity: { gt: 0 }
          }
        ]
      },
      orderBy: getOrderBy(order),
      skip: (parseInt(page) - 1) * parseInt(size),
      take: parseInt(size),
      select: {
        id: true,
        image: true,
        grade: true,
        genre: true,
        name: true,
        user: { select: { nickname: true } }
      }
    });

    const totalData = await prisma.card.findMany({
      where: {
        AND: [
          { grade },
          { genre },
          {
            OR: [
              { name: { contains: keyword } },
              { description: { contains: keyword } }
            ]
          },
          {
            availableQuantity: { gt: 0 }
          }
        ]
      }
    });

    const totalCount = totalData.length;
    const totalPages = Math.ceil(totalCount / size);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(201).send({
      data,
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

//내 판매카드 조회
userRouter.get("/my-cards/sales", verifyToken, async (req, res) => {
  try {
    const { userId } = req.decoded.userId;

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

    const sellingCardData = await prisma.shop.findMany({
      where: {
        ...whereIsSoldOut,
        sellerId: userId,
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

    const processedData = sellingCardData.map((v) => {
      const card = { ...v.card };
      delete card.user;
      return {
        id: v.id,
        ...card,
        price: v.sellingPrice,
        totalQuantity: v.sellingQuantity,
        remainingQuantity: v.remainingQuantity,
        isSoldOut: Boolean(v.remainingQuantity),
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

//내 교환카드 조회
userRouter.get("/my-cards/exchange", verifyToken, async (req, res) => {
  try {
    const userId = req.decoded.userId;
    const exchangingCardList = await prisma.exchange.findMany({
      where: { requesterId: userId },
      select:{
        
      }
    });
    res.status(201).send(exchangingCardList);
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});

//프로필 조회
userRouter.get("/profile", verifyToken, async (req, res) => {
  try {
    const userData = await prisma.user.findUnique({
      where: { id: req.decoded.userId }
    });

    const cardCountData = await prisma.card.groupBy({
      by: ["grade"],
      where: { ownerId: req.decoded.userId, totalQuantity: { gt: 0 } },
      _count: {
        grade: true
      }
    });

    const cardCount = {
      totalCount: 0,
      commonCount: 0,
      rareCount: 0,
      superRareCount: 0,
      legendaryCount: 0
    };

    cardCountData.map((v) => {
      if (v.grade === "COMMON") cardCount.commonCount = v._count.grade;
      if (v.grade === "RARE") cardCount.rareCount = v._count.grade;
      if (v.grade === "SUPER_RARE") cardCount.superRareCount = v._count.grade;
      if (v.grade === "LEGENDARY") cardCount.legendaryCount = v._count.grade;
      cardCount.totalCount += v._count.grade;
    });

    delete userData.password;

    return res.status(201).send({ ...userData, cardCount });
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});
