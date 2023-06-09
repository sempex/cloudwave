import { connect } from "@dagger.io/dagger";
import { BuildProps, Framework } from "./frameworks.js";
import { z } from "zod";

const buildOptionsValidator = z.object({}).optional();

type StaticBuildProps = z.infer<typeof buildOptionsValidator>;

export const staticFramework: Framework<StaticBuildProps> = {
  builder: staticBuilder,
  icon: "https://cdn.pixabay.com/photo/2017/08/05/11/16/logo-2582748_1280.png",
  displayName: "Static Website",
  buildOptionsValidator,
  buildOptions: [],
};

async function staticBuilder({
  git,
  branch,
  name,
  basePath,
}: BuildProps<StaticBuildProps>): Promise<null | string> {
  let image = null;

  const workDir = basePath ? "/app" + basePath : "/app";  

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
        .withWorkdir(workDir)
        .withEntrypoint(["busybox", "httpd", "-f", "-v", "-p", "3000"]);

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
