import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
// import { nodePipeline } from "./ci/npmimage";
import { connect } from "@dagger.io/dagger";
import node from "./ci/pipelines/node.js";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

type Get = {
  req: Request;
  res: Response;
};

app.get("/", (req, res) => {
  connect(
    async (client) => {
      // use a node:16-slim container
      // get version
      const node = client
        .container()
        .from("node:16-slim")
        .withExec(["node", "-v"]);

      // execute
      const version = await node.stdout();

      // print output
      console.log("Hello from Dagger and Node " + version);
    },
    { LogOutput: process.stdout }
  );
  res.send("Express + TypeScript Server");
});

app.get("/deploy", async (req, res) => {
  node("https://github.com/eMahtab/node-express-hello-world");
  res.send("running pipeline...");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
