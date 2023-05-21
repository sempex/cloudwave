import { Router } from "express";
import { webhookHandler } from "./webhooks.handler.js";

const githubRouter = Router();

githubRouter.post("/event", webhookHandler);

export default githubRouter;
