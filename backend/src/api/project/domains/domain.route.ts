import { Router } from "express";
import { deserializeUser } from "../../../middleware/deserializeUser.js";
import { requireUser } from "../../../middleware/requireUser.js";
import {
  addDomainHandler,
  deleteDomainHandler,
  getDomainHandler,
} from "./domain.handler.js";

const domainRouter = Router({ mergeParams: true });

domainRouter.use(deserializeUser, requireUser);

domainRouter.post("/", addDomainHandler);
domainRouter.get("/", getDomainHandler);
domainRouter.delete("/", deleteDomainHandler);

export default domainRouter;
