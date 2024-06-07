import { PrismaClient } from "@prisma/client";
import express from "express";
import { verifyToken } from "../util/jwt-verify.js";

const prisma = new PrismaClient();
export const pointRouter = express.Router();

//랜덤포인트 뽑기
pointRouter.get("/box", verifyToken, async (req, res) => {
  const userId = req.decoded.userId;

  const userData = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true, lastDrawTime: true }
  });

  const currentTime = BigInt(Date.now());
  if (
    !userData.lastDrawTime ||
    currentTime - userData.lastDrawTime >= 60 * 60 * 1000
  ) {
    const randomPoints = Math.floor(Math.random() * 10) + 1;

    await prisma.user.update({
      where: { id: userId },
      data: {
        points: userData.points + randomPoints,
        lastDrawTime: currentTime
      }
    });

    res.status(201).send({ success: true, randomPoints });
  } else {
    res.status(201).send({ success: false });
  }
});
