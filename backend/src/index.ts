import express, { Express } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import deployRouter from "./api/deploy/route.js";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use(bodyParser.json());

app.use("/deploy", deployRouter);

app.get("/", (req, res) => {
  res.send("Express + TypeScript Server");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
