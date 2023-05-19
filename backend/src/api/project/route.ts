import { Router } from "express";
import { post } from "./project.handler.js";
import { deserializeUser } from "../../middleware/deserializeUser.js";
import { requireUser } from "../../middleware/requireUser.js";

const deployRouter = Router();

deployRouter.use(deserializeUser, requireUser);

deployRouter.post("/", post);

export default deployRouter;
