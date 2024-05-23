import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();

app.get("/user", (req, res) => {
  res.send("test");
});

app.listen(3000, () => console.log("Server Started"));
