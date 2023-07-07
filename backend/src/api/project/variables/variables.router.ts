import express from "express";
import { deserializeUser } from "../../../middleware/deserializeUser.js";
import { requireUser } from "../../../middleware/requireAdmin.js";
import {
  deleteVariablesHandler,
  getVariablesHandler,
  postVariablesHandler,
} from "./variables.handler.js";

const variablesRouter = express.Router({ mergeParams: true });

variablesRouter.use(deserializeUser, requireUser);

// Get my info route
variablesRouter.get("/:envId", getVariablesHandler);
variablesRouter.post("/:envId", postVariablesHandler);
variablesRouter.delete("/:envId", deleteVariablesHandler);

export default variablesRouter;
