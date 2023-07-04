import express from "express";
import { getFrameworksHandler } from "./frameworks.handler.js";

const frameworkRouter = express.Router();

// Get my info route
frameworkRouter.get("/", getFrameworksHandler);

export default frameworkRouter;
