import { NextFunction, Request, Response } from "express";
import { frameworks } from "../../lib/ci/pipelines/frameworks.js";

export const getFrameworksHandler = (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    frameworks: Object.entries(frameworks).map(([key, framework]) => ({
      id: key,
      name: framework.displayName,
      buildOptions: framework.buildOptions,
      icon: framework.icon,
    })),
  });
};
