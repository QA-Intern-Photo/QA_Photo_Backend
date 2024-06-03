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

//프로필 조회
userRouter.get("/profile", verifyToken, async (req, res) => {
  try {
    const { email, nickname, points, createdAt, updatedAt } =
      await prisma.user.findUnique({
        where: { id: req.decoded.userId }
      });
    return res
      .status(201)
      .send({ email, nickname, points, createdAt, updatedAt });
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});
