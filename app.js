import { Prisma, PrismaClient } from "@prisma/client";
import express from "express";
import { authRouter } from "./routes/auth.js";
// import swaggerUi from "swagger-ui-express";
// import swaggerJsdoc from "swagger-jsdoc";
// import { options } from "./swagger/config.js";
import cors from "cors";

const corsOptions = {
  origin: ["http://localhost:3000"]
};
const app = express();
app.use(cors(corsOptions));

// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(options)));

app.use(express.json()); //req.body 읽기위함
//routing
app.use("/api/auth", authRouter);

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

app.listen(3000, () => console.log("Server Started"));
