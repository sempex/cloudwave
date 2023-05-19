import { connect } from "@dagger.io/dagger";
import { BuildProps, Framework } from "./frameworks.js";
import { z } from "zod";

const buildOptionsValidator = z.object({}).optional();

type StaticBuildProps = z.infer<typeof buildOptionsValidator>;

export const staticFramework: Framework<StaticBuildProps> = {
  builder: staticBuilder,
  displayName: "Static Website",
  buildOptionsValidator,
  buildOptions: [],
};

async function staticBuilder({
  git,
  branch,
  name,
}: BuildProps<StaticBuildProps>): Promise<null | string> {
  let image = null;

  await connect(
    async (client) => {
      const src = client.git(git).branch(branch).tree();
      // use a node:16-slim container
      // get version
      const container = client
        .container()
        .from("busybox:1.35")
        .withExec(["adduser", "-D", "static"])
        .withExec(["su", "static"])
        .withDirectory("/app", src)
        .withWorkdir("/app")
        .withEntrypoint(["busybox", "httpd", "-f", "-v", "-p", "3000"]);

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