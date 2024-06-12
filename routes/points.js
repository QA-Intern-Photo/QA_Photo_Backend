import { PrismaClient } from "@prisma/client";
import express from "express";
import { verifyToken } from "../util/jwt-verify.js";

const prisma = new PrismaClient();
export const pointRouter = express.Router();

//마지막 뽑은 시간 조회
pointRouter.get("/last-draw-time", verifyToken, async (req, res) => {
  try {
    const userId = req.decoded.userId;

    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastDrawTime: true }
    });

    const currentTime = new Date();
    const userLastDrawTime = new Date(userData.lastDrawTime);
    let isPossible = false;
    if (!userData.lastDrawTime)
      return res.status(200).send({ isPossible: true, lastDrawTime: null });
    if (
      Date.parse(currentTime) - Date.parse(userLastDrawTime) >=
      60 * 60 * 1000
    ) {
      isPossible = true;
    }
    res.status(200).send({ isPossible, lastDrawTime: userData.lastDrawTime });
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});

//랜덤포인트 뽑기
pointRouter.post("/box", verifyToken, async (req, res) => {
  const userId = req.decoded.userId;
  const { randomPoints } = req.body;

  const userData = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true, lastDrawTime: true }
  });

  const currentTime = new Date();
  const userLastDrawTime = new Date(userData.lastDrawTime);
  if (
    !userData.lastDrawTime ||
    Date.parse(currentTime) - Date.parse(userLastDrawTime) >= 60 * 60 * 1000
  ) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        points: userData.points + Number(randomPoints)
      }
    });

    res.status(200).send({
      isSuccess: true,
      randomPoints,
      lastDrawTime: currentTime.toISOString()
    });
  } else {
    res
      .status(200)
      .send({ isSuccess: false, lastDrawTime: userData.lastDrawTime });
  }
});
