import { connect } from "@dagger.io/dagger";

export default async function node(git: string) {
  return connect(
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

      const imgRef = await container.publish("ttl.sh/tims-demo-v1:1h");

      // print output
      console.log("Hello from Dagger and Node " + version, " REF:", imgRef);
    },
    { LogOutput: process.stdout }
  );
}
