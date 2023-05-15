import { connect } from "@dagger.io/dagger";

export default async function node(
  git: string,
  name: string
): Promise<null | string> {
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
      const version = await container.stdout();

      const imgRef = await container.publish(
        `ttl.sh/cloudwave-image-${name}:1h`
      );

      image = imgRef;
    },
    { LogOutput: process.stdout }
  );

  return image;
}
