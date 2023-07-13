import { connect } from "@dagger.io/dagger";
import { BuildProps, Framework } from "./frameworks.js";
import { z } from "zod";

const packageManagers = {
  yarn: {
    install: ["yarn", "install", "--frozen-lockfile"],
    build: ["yarn", "build"],
  },
  npm: {
    install: ["npm", "ci"],
    build: ["npm", "run", "build"],
  },
  pnpm: {
    install: [
      "yarn",
      "global",
      "add",
      "pnpm",
      "&&",
      "pnpm",
      "i",
      "--frozen-lockfile",
    ],
    build: ["npm", "run", "build"],
  },
};

const buildOptionsValidator = z
  .object({})
  .optional();

type NodeBuildProps = z.infer<typeof buildOptionsValidator>;

export const nextjsFramework: Framework<NodeBuildProps> = {
  builder: nodeBuilder,
  icon: "https://static-00.iconduck.com/assets.00/next-js-icon-512x512-zuauazrk.png",
  displayName: "Basic Next app",
  buildOptionsValidator,
  buildOptions: [],
};

async function nodeBuilder({
  git,
  name,
  branch,
  basePath,
  buildParameters,
}: BuildProps<NodeBuildProps>): Promise<null | string> {
  let image = null;
  const nodeEnv = "production";

  const ADD_GROUP = ["addgroup", "--system", "--gid", "1001", "nodejs"];
  const ADD_USER = ["adduser", "--system", "--uid", "1001", "nextjs"];

  const workDir = basePath ? "/app" + basePath : "/app";

  console.log("Building Next.js app");

  await connect(
    async (client) => {
      const src = client.git(git).branch(branch).tree();

      const entries = await src.entries({
        path: "/",
      });

      const isYarn = entries.find((e) => e === "yarn.lock");
      const isNpm = entries.find((e) => e === "package-lock.json");
      const isPnpm = entries.find((e) => e === "pnpm-lock.yaml");

      const packageManager =
        packageManagers[isYarn ? "yarn" : isNpm ? "npm" : "pnpm"];

      const deps = client
        .container()
        .from("node:18-alpine")
        .withExec(["apk", "add", "--no-cache", "libc6-compat"])
        .withDirectory("/app", src)
        .withWorkdir(workDir)
        .withExec(packageManager.install);

      const builder = client
        .container()
        .from("node:18-alpine")
        .withWorkdir("/app")
        .withDirectory("/app", src)
        .withDirectory("/app/node_modules", deps.directory("/app/node_modules"))
        .withExec(packageManager.build);

      const runner = client
        .container()
        .from("node:18-alpine")
        .withWorkdir("/app")
        .withEnvVariable("NODE_ENV", nodeEnv)
        .withExec(ADD_GROUP)
        .withExec(ADD_USER)
        .withDirectory("./public", builder.directory("/app/public"))
        .withDirectory("./", builder.directory("/app/.next/standalone"), {
          owner: "nextjs:nodejs",
        })
        .withDirectory(
          "./.next/static",
          builder.directory("/app/.next/static"),
          { owner: "nextjs:nodejs" }
        )
        .withUser("nextjs")
        .withExposedPort(3000)
        .withEnvVariable("PORT", "3000")
        .withEntrypoint(["node", "server.js"]);

      // execute
      const secret = client.setSecret("sec", process.env.REGISTRY_PASSWORD);

      const imgRef = await runner
        .withRegistryAuth(
          process.env.REGISTRY_URL,
          process.env.REGISTRY_USERNAME,
          secret
        )
        .publish(`${process.env.REGISTRY_URL}/shiper-${name}`);

      image = imgRef;
    },
    { LogOutput: process.stdout }
  );

  return image;
}
