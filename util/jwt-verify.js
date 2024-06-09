import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
const prisma = new PrismaClient();
export const verifyToken = async (req, res, next) => {
  try {
    req.decoded = jwt.verify(
      req.headers.authorization.split(" ")[1],
      process.env.JWT_SECRET
    );

    //토큰 무효화 확인
    const tokenData = await prisma.token.findUnique({
      where: { userId: req.decoded.userId },
      select: { accessToken: true }
    });

    if (tokenData.accessToken !== req.headers.authorization.split(" ")[1])
      return res.status(401).json({
        status: 401,
        message: "유효하지 않은 토큰입니다."
      });

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(419).json({
        status: 419,
        message: "토큰이 만료되었습니다."
      });
    }
    return res.status(401).json({
      status: 401,
      message: "유효하지 않은 토큰입니다."
    });
  }
};

export const verifyRefreshToken = async (req, res, next) => {
  try {
    req.decoded = jwt.verify(req.body.refreshToken, process.env.JWT_SECRET);

    //토큰 무효화 확인
    const tokenData = await prisma.token.findUnique({
      where: { userId: req.decoded.userId },
      select: { refreshToken: true }
    });
    if (tokenData.refreshToken !== req.body.refreshToken)
      return res.status(401).json({
        status: 401,
        message: "유효하지 않은 토큰입니다."
      });

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(419).json({
        status: 419,
        message: "토큰이 만료되었습니다."
      });
    }
    return res.status(401).json({
      status: 401,
      message: "유효하지 않은 토큰입니다."
    });
  }
};
