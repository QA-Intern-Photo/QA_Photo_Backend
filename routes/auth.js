import express from "express";
import { CreateUser } from "../structs.js";
import { assert } from "superstruct";
import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

export const authRouter = express.Router();

//회원가입
authRouter.post("/signup", async (req, res) => {
  try {
    assert(req.body, CreateUser);
    // req.body.password = "diff";
    const user = await prisma.user.create({ data: req.body });
    res.status(201).send(user);
  } catch (e) {
    if (e.code === "P2002")
      return res.status(500).send({ message: "중복이메일" });
    return res.status(500).send({ message: e.message });
  }
});

//로그인
authRouter.post("/login", async (req, res) => {});

//로그아웃
authRouter.post("/logout", async (req, res) => {});

//토큰 갱신
authRouter.post("/refresh", async (req, res) => {});
