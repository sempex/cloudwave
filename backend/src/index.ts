import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
// import { nodePipeline } from "./ci/npmimage";
import { connect } from "@dagger.io/dagger";
import node from "./ci/pipelines/node.js";
import deploy from "./lib/k8s/deploy.js";
import bodyParser from "body-parser";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use(bodyParser.json());

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

app.post("/deploy", async (req, res) => {
  const appName = req.body.name;
  const git = req.body.git;

  if (!appName) res.status(400).send("please supply a appName");
  if (!git) res.status(400).send("please supply a git repo");

  const appPort = req.body.port;

  const image = await node(git, appName);

  if (!image) return res.status(500).send("Image url could not be retrieved");

  const deployment = await deploy(appName, {
    image: image,
    appPort: appPort,
  });

  res.send({
    url: "http://" + deployment.domain,
  });
});

app.get("/k0s", async (req, res) => {
  deploy("jannis", {
    image:
      "ttl.sh/tims-demo-v1:1h@sha256:86653350c289152147d38e7df8ef4d5c252a142710fa28a310ed8acf59e497cf",
  });
  res.send("Your App is getting deployed...");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
