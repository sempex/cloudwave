import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
// import { nodePipeline } from "./ci/npmimage";
import { connect } from "@dagger.io/dagger";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

type Get = {
  req: Request;
  res: Response;
};

app.get("/", ({ req, res }: Get) => {
  connect(async (client) => {

    // use a node:16-slim container
    // get version
    const node = client.container().from("node:16-slim").withExec(["node", "-v"])
  
    // execute
    const version = await node.stdout()
  
    // print output
    console.log("Hello from Dagger and Node " + version)
  }, { LogOutput: process.stdout })
  res.send("Express + TypeScript Server");
}
);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
