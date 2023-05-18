import { connect } from "@dagger.io/dagger";
import { BuildProps, Framework } from "./frameworks.js";

export default async function nodeBuilder({
  git,
  name,
  buildParameter,
}: BuildProps): Promise<null | string> {
  let image = null;

  await connect(
    async (client) => {
      const src = client.git(git).branch("master").tree();
      // use a node:16-slim container
      // get version
      const container = client
        .container()
        .from("node:16-slim")
        .withDirectory("/app", src)
        .withWorkdir("/app")
        .withExec(["npm", "i"])
        .withEntrypoint(["npm", "start"]);

      // execute

      const imgRef = await container.publish(
        `ttl.sh/cloudwave-image-${name}:1h`
      );

      image = imgRef;
    },
    { LogOutput: process.stdout }
  );

  return image;
}

export const nodeFramework: Framework = {
  builder: nodeBuilder,
  displayName: "Basic Node app",
  buildOptions: [
    {
      id: "buildCommand",
      name: "Build Command",
      required: false,
      default: "npm run build",
    },
    {
      id: "runCommand",
      name: "Build Command",
      required: false,
      default: "npm start",
    },
  ],
};
