import { PrismaClient } from "@prisma/client";
import express from "express";
import { verifyToken } from "../util/jwt-verify.js";
import { timeAgo } from "../util/time-ago.js";

const prisma = new PrismaClient();
export const notificationRouter = express.Router();

//포토카드 교환 제안하기
notificationRouter.get("/", verifyToken, async (req, res) => {
  try {
    const { page = 1, size = 5 } = req.query;
    const userId = req.decoded.userId;
    const data = await prisma.notification.findMany({
      where: { userId },
      skip: (parseInt(page) - 1) * parseInt(size),
      take: parseInt(size),
      orderBy: { createdAt: "desc" }
    });

    const totalData = await prisma.user.findMany({
      where: { id: userId },
      select: {
        _count: {
          select: { Notification: true }
        }
      }
    });

    const totalCount = totalData[0]._count.Notification;
    const totalPages = Math.ceil(totalCount / size);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const processedData = data.map((v) => {
      return {
        content: v.content,
        timeAgo: timeAgo(v.createdAt),
        isRead: v.status === "READ" ? true : false
      };
    });

    //알림 읽음처리
    await prisma.notification.updateMany({
      where: { AND: [{ userId }, { status: "NOT_READ" }] },
      data: { status: "READ" }
    });

    return res.status(200).send({
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
