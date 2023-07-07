import express, { Express } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import deployRouter from "./api/project/route.js";
import { PrismaClient } from "@prisma/client";
import authRouter from "./api/auth/auth.route.js";
import cookieParser from "cookie-parser";
import connectDB from "./lib/db/prisma.js";
import cors from "cors";
import userRouter from "./api/user/user.router.js";
import githubRouter from "./api/github/github.router.js";
import domainRouter from "./api/project/domains/domain.route.js";
import { queue } from "./lib/queue/index.js";
import { initWorker } from "./lib/queue/worker.js";
import frameworkRouter from "./api/frameworks/frameworks.router.js";
import variablesRouter from "./api/project/variables/variables.router.js";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cookieParser());

app.use(
  cors({
    credentials: true,
    origin: [process.env.FRONTEND_ORIGIN],
  })
);

app.use("/project", deployRouter);
app.use("/project/:id/domain", domainRouter);
app.use("/project/:id/variables", variablesRouter);
app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/github", githubRouter);
app.use("/frameworks", frameworkRouter);

app.get("/", (req, res) => {
  res.send("shiper.app API");
});

app.listen(port, async () => {
  console.log(`✅ Server is running at http://localhost:${port}`);
  connectDB();
  initWorker();
});
