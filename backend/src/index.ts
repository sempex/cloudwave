import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { nodePipeline } from "./ci/npmimage";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

type Get = {
  req: Request,
  res: Response
};

app.get("/", ({req, res}:Get) => {
  nodePipeline()
  res.send("Express + TypeScript Server");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

