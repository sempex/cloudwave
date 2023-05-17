import express, { Express } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import deployRouter from "./api/deploy/route.js";
import { PrismaClient } from "@prisma/client";
import authRouter from "./api/auth/auth.route.js";
import cookieParser from "cookie-parser";
import connectDB from "./lib/db/prisma.js";
import cors from "cors";
import userRouter from "./api/user/user.router.js";

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

app.use("/deploy", deployRouter);
app.use("/auth", authRouter);
app.use("/user", userRouter);

app.get("/", (req, res) => {
  res.send("shiper.app API");
});

app.listen(port, () => {
  console.log(`✅ Server is running at http://localhost:${port}`);
  connectDB();
});
