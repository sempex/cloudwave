import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { exclude } from "../api/auth/auth.handler.js";
import { prisma } from "../lib/db/prisma.js";

export const deserializeUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in",
      });
    }

    const JWT_SECRET = process.env.SESSION_SECRET;
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid token or user doesn't exist",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: String(decoded.sub) },
    });

    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "User with that token no longer exist",
      });
    }

    res.locals.user = user;

    next();
  } catch (err: any) {
    next(err);
  }
};
