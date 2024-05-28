import express from "express";
import { CreateUser } from "../structs.js";
import { assert } from "superstruct";
import { PrismaClient, Prisma } from "@prisma/client";
import { verifyToken } from "../util/jwt-verify.js";

const prisma = new PrismaClient();

export const userRouter = express.Router();

userRouter.post("/my-cards", async (req, res) => {});

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
