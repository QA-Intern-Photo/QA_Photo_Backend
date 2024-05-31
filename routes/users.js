import express from "express";
import { CreateCard, CreateUser } from "../structs.js";
import { assert, number } from "superstruct";
import { PrismaClient, Prisma } from "@prisma/client";
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
          remainingQuantity: Number(req.body.totalQuantity),
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
