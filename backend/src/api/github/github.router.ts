import { Router } from "express";
import { deserializeUser } from "../../middleware/deserializeUser.js";
import { requireUser } from "../../middleware/requireUser.js";
import { webhookHandler } from "./github.handler.js";

const githubRouter = Router();

githubRouter.post("/event", webhookHandler);

export default githubRouter;
