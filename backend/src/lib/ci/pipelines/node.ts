import { connect } from "@dagger.io/dagger";
import { BuildProps, Framework } from "./frameworks.js";
import { z } from "zod";

const buildOptionsValidator = z
  .object({
    buildCommand: z.string(),
    runCommand: z.string(),
  })
  .optional();

type NodeBuildProps = z.infer<typeof buildOptionsValidator>;

export const nodeFramework: Framework<NodeBuildProps> = {
  builder: nodeBuilder,
  displayName: "Basic Node app",
  buildOptionsValidator,
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

async function nodeBuilder({
  git,
  name,
  buildParameters,
}: BuildProps<NodeBuildProps>): Promise<null | string> {
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
