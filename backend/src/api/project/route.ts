import { Router } from "express";
import { deleteHandler, getHandler, post } from "./project.handler.js";
import { deserializeUser } from "../../middleware/deserializeUser.js";
import { requireUser } from "../../middleware/requireUser.js";

const deployRouter = Router();

deployRouter.use(deserializeUser, requireUser);

deployRouter.post("/init", post);
deployRouter.delete("/:id", deleteHandler);
deployRouter.get("/:id", getHandler);

export default deployRouter;
