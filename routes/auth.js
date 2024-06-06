import express from "express";
import { CreateUser, LoginUser } from "../structs.js";
import { assert } from "superstruct";
import jwt from "jsonwebtoken";
import { PrismaClient, Prisma } from "@prisma/client";
import { verifyRefreshToken, verifyToken } from "../util/jwt-verify.js";

const prisma = new PrismaClient();

export const authRouter = express.Router();

authRouter.get("/test", async (req, res) => {
  const test = await prisma.shop.findUnique({
    where: { id: "test" }
  });
  if (!test) console.log("exist");
  res.send(test);
});
//회원가입
authRouter.post("/signup", async (req, res) => {
  try {
    assert(req.body, CreateUser);
    // req.body.password = "diff";
    const { email, nickname, points, createdAt, updatedAt } =
      await prisma.user.create({ data: req.body });
    res.status(201).send({ email, nickname, points, createdAt, updatedAt });
  } catch (e) {
    if (e.code === "P2002")
      return res.status(409).send({ message: "이미 사용중인 이메일입니다." });
    return res.status(500).send({ message: e.message });
  }
});

//로그인
authRouter.post("/login", async (req, res) => {
  try {
    assert(req.body, LoginUser);
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email, password }
    });

    if (user) {
      const accessToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d"
        }
      );
      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d"
        }
      );

      return res.send({
        accessToken,
        refreshToken
      });
    }

    return res
      .status(404)
      .send({ status: 404, message: "존재하지 않는 유저입니다." });
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});

//로그아웃
authRouter.post("/logout", verifyToken, async (req, res) => {
  res.send({ status: 200, message: "로그아웃 성공" });
});

//토큰 갱신
authRouter.post("/refresh", verifyRefreshToken, async (req, res) => {
  try {
    const newAccessToken = jwt.sign(
      { userId: req.decoded.userId },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );
    return res.send({ newAccessToken });
  } catch (e) {
    return res.status(500).send({ message: e.message });
  }
});
