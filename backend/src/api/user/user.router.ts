import express from "express";
import { deserializeUser } from "../../middleware/deserializeUser.js";
import { requireUser } from "../../middleware/requireUser.js";
import { getMeHandler } from "./user.handler.js";

const userRouter = express.Router();

userRouter.use(deserializeUser, requireUser);

// Get my info route
userRouter.get("/me", getMeHandler);

export default userRouter;
