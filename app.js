import express from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { CreateUser } from "./structs.js";
import { assert } from "superstruct";

const prisma = new PrismaClient();
const app = express();
app.use(express.json()); //req.body 읽기위함

app.get("/user", (req, res) => {
  res.send("test");
});

function asyncHandler(handler) {
  return async function (req, res) {
    try {
      await handler(req, res);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientValidationError ||
        e.name === "StructError"
      ) {
        res.status(400).send({ message: e.message });
      } else if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2025"
      ) {
        res.sendStatus(404);
      } else {
        res.status(500).send({ message: e.message });
      }
    }
  };
}

app.post("/api/auth/signup", async (req, res) => {
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

app.listen(3000, () => console.log("Server Started"));
