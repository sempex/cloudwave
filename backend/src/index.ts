import express, { Express } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import deployRouter from "./api/deploy/route.js";
import expressSession from "express-session";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { PrismaClient } from "@prisma/client";
import authRouter from "./api/auth/route.js";
import passport from "./lib/auth/passport.js";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;
const prisma = new PrismaClient();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
  expressSession({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // ms
    },
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/deploy", deployRouter);
app.use("/auth", authRouter);

app.get("/", (req, res) => {
  res.send("shiper.app API");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
