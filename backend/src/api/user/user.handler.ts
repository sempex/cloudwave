import { NextFunction, Request, Response } from "express";
import { custom } from "../../lib/k8s/k8s.js";

export const getMeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = res.locals.user;
    res.status(200).json({
      status: "success",
      user,
    });
  } catch (err: any) {
    next(err);
  }
};
