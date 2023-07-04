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
  icon: "https://static-00.iconduck.com/assets.00/node-js-icon-454x512-nztofx17.png",
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
  branch,
  buildParameters,
}: BuildProps<NodeBuildProps>): Promise<null | string> {
  let image = null;

  await connect(
    async (client) => {
      const src = client.git(git).branch(branch).tree();
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
      const secret = client.setSecret("sec", process.env.REGISTRY_PASSWORD);

      const imgRef = await container
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
