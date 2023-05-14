import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
// import { nodePipeline } from "./ci/npmimage";
import { connect } from "@dagger.io/dagger";
import node from "./ci/pipelines/node.js";
import deploy from "./lib/k8s/deploy.js";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

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

app.get("/k0s", async (req, res) => {
  deploy(
    "jannis",
    "ttl.sh/tims-demo-v1:1h@sha256:86653350c289152147d38e7df8ef4d5c252a142710fa28a310ed8acf59e497cf"
  );
  res.send("Your App is getting deployed...")
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
