import express from "express";
import { assert } from "superstruct";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../util/jwt-verify.js";

const prisma = new PrismaClient();
export const exchangeRouter = express.Router();

//포토카드 교환 제안하기
exchangeRouter.post("/:id/exchange", async (req, res) => {});
