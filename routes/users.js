import express from "express";
import { CreateCard } from "../structs.js";
import { assert } from "superstruct";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../util/jwt-verify.js";
import { upload } from "../util/upload-image.js";
import { getOrderBy, myCardGetOrderBy } from "../util/get-order-by.js";
import { getCardCount } from "../util/get-card-count.js";
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
    const userId = req.decoded.userId;
    const {
      page = 1,
      size = 5,
      order = "newest",
      grade,
      genre,
      keyword
    } = req.query;

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
          },
          { ownerId: userId }
        ]
      },
      orderBy: myCardGetOrderBy(order),
      skip: (parseInt(page) - 1) * parseInt(size),
      take: parseInt(size),
      select: {
        id: true,
        image: true,
        grade: true,
        genre: true,
        name: true,
        totalQuantity: true,
        availableQuantity: true,
        price: true,
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
          },
          { ownerId: userId }
        ]
      }
    });

    const totalCount = totalData.length;
    const totalPages = Math.ceil(totalCount / size);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const cardCountData = await prisma.card.groupBy({
      by: ["grade"],
      where: {
        ownerId: req.decoded.userId,
        totalQuantity: { gt: 0 },
        availableQuantity: { gt: 0 }
      },
      _count: {
        grade: true
      }
    });

    const cardCount = getCardCount(cardCountData);

    res.status(200).send({
      data,
      pagination: {
        totalCount,
        totalPages,
        currentPage: Number(page),
        pageSize: Number(size),
        hasNextPage,
        hasPrevPage
      },
      cardCount
    });
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});

//내 판매카드 조회
userRouter.get("/my-cards/sales", verifyToken, async (req, res) => {
  try {
    const userId = req.decoded.userId;

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
      select: {
        card: true
      }
    });

    const totalCount = totalData.length;
    const totalPages = Math.ceil(totalCount / size);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const processedData = sellingCardData.map((v) => {
      return {
        id: v.id,
        ...v.card,
        price: v.sellingPrice,
        quantity: v.remainingQuantity
      };
    });

    //판매카드 grade별 개수
    const commonCount = await prisma.shop.count({
      where: { sellerId: userId, card: { grade: "COMMON" } }
    });
    const rareCount = await prisma.shop.count({
      where: { sellerId: userId, card: { grade: "RARE" } }
    });
    const superRareCount = await prisma.shop.count({
      where: { sellerId: userId, card: { grade: "SUPER_RARE" } }
    });
    const legendaryCount = await prisma.shop.count({
      where: { sellerId: userId, card: { grade: "LEGENDARY" } }
    });

    const cardCount = {
      totalCount: commonCount + rareCount + superRareCount + legendaryCount,
      commonCount,
      rareCount,
      superRareCount,
      legendaryCount
    };

    res.status(200).send({
      data: processedData,
      pagination: {
        totalCount,
        totalPages,
        currentPage: Number(page),
        pageSize: Number(size),
        hasNextPage,
        hasPrevPage
      },
      cardCount
    });
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});

//내 교환카드 조회
userRouter.get("/my-cards/exchange", verifyToken, async (req, res) => {
  try {
    const userId = req.decoded.userId;

    const {
      page = 1,
      size = 5,
      order = "newest",
      grade,
      genre,
      keyword
    } = req.query;

    const exchangingCardData = await prisma.exchange.findMany({
      where: {
        requesterId: userId,
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
      orderBy: { card: myCardGetOrderBy(order) },
      skip: (parseInt(page) - 1) * parseInt(size),
      take: parseInt(size),

      select: {
        id: true,
        targetCardId: true,
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

    const totalData = await prisma.exchange.findMany({
      where: {
        requesterId: userId,
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

    const processedData = exchangingCardData.map((v) => {
      return {
        id: v.id,
        shopId: v.targetCardId,
        ...v.card,
        quantity: 1
      };
    });
    //판매카드 grade별 개수
    const commonCount = await prisma.exchange.count({
      where: { requesterId: userId, card: { grade: "COMMON" } }
    });
    const rareCount = await prisma.exchange.count({
      where: { requesterId: userId, card: { grade: "RARE" } }
    });
    const superRareCount = await prisma.exchange.count({
      where: { requesterId: userId, card: { grade: "SUPER_RARE" } }
    });
    const legendaryCount = await prisma.exchange.count({
      where: { requesterId: userId, card: { grade: "LEGENDARY" } }
    });

    const cardCount = {
      totalCount: commonCount + rareCount + superRareCount + legendaryCount,
      commonCount,
      rareCount,
      superRareCount,
      legendaryCount
    };
    res.status(200).send({
      data: processedData,
      pagination: {
        totalCount,
        totalPages,
        currentPage: Number(page),
        pageSize: Number(size),
        hasNextPage,
        hasPrevPage
      },
      cardCount
    });
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});

//프로필 조회
userRouter.get("/profile", verifyToken, async (req, res) => {
  try {
    const userData = await prisma.user.findUnique({
      where: { id: req.decoded.userId },
      select: { id: true, email: true, nickname: true, points: true }
    });

    delete userData.password;

    return res.status(200).send({ ...userData });
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});

userRouter.get("/check-email", async (req, res) => {
  try {
    const { email } = req.query;
    const data = await prisma.user.findUnique({ where: { email } });
    if (data) return res.status(409).send({ message: "중복 이메일" });
    return res.status(200).send({ message: "사용가능한 이메일" });
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});

userRouter.get("/check-nickname", async (req, res) => {
  try {
    const { nickname } = req.query;
    const data = await prisma.user.findUnique({ where: { nickname } });
    if (data) return res.status(409).send({ message: "중복 닉네임" });
    return res.status(200).send({ message: "사용가능한 닉네임" });
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});
