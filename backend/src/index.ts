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
    // mount the source code directory from the host at /src in the container
    const source = client
      .container()
      .from("node:16-slim")
      .withDirectory("/src", client.host().directory("."), {
        exclude: ["node_modules/", "ci/"],
      });

    // set the working directory in the container
    // install application dependencies
    const runner = source.withWorkdir("/src").withExec(["npm", "install"]);

    // build application
    // write the build output to the host
    const buildDir = runner
      .withExec(["npm", "run", "build"])
      .directory("./build");

    await buildDir.export("./build");
    const e = await buildDir.entries();

    console.log("build dir contents:\n", e);
  });
  res.send("Express + TypeScript Server");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
