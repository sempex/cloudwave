import { Router } from "express";
import { post } from "./handler.js";

const deployRouter = Router();

deployRouter.post("/", post);

export default deployRouter;
