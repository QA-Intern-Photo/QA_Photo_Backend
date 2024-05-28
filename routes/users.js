import express from "express";
import { CreateUser } from "../structs.js";
import { assert } from "superstruct";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export const userRouter = express.Router();

userRouter.post("/my-cards",async(req,res)=>{

})