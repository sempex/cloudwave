import { Router } from "express";
import { deserializeUser } from "../../../middleware/deserializeUser.js";
import { requireUser } from "../../../middleware/requireUser.js";
import { addDomainHandler, getDomainHandler } from "./domain.handler.js";

const domainRouter = Router({ mergeParams: true });

domainRouter.use(deserializeUser, requireUser);

domainRouter.post("/", addDomainHandler);
domainRouter.get("/", getDomainHandler);

export default domainRouter;
