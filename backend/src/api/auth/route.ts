import { Router } from "express";
import { post } from "./handler.js";

const authRouter = Router();

authRouter.post("/", post);

export default authRouter;
