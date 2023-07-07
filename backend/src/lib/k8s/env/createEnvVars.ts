import { V1DeleteOptions, V1EnvVar, V1Secret } from "@kubernetes/client-node";
import { globalConfig } from "../../config.js";
import { core } from "../k8s.js";
import { formatK8sEnv } from "./formatK8sEnv.js";

export async function createEnv(
  ns: string,
  secretName: string,
  secrets: { [key: string]: string }
): Promise<{
  env: V1EnvVar[];
  secretName: string | null;
  variables: { [key: string]: string };
}> {
  try {
    // Check if the secret already exists
    try {
      const existingSecret = await core.readNamespacedSecret(secretName, ns);
      if (existingSecret && existingSecret.body) {
        // Delete the existing secret
        await core.deleteNamespacedSecret(secretName, ns);
        console.log(`Deleted existing secret "${secretName}"`);
      }
    } catch (err) {
      console.log(
        `Currently no secret named "${secretName}" exists, creating...`
      );
    }

    const secret: V1Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: secretName,
      },
      type: "Opaque",
      stringData: secrets,
    };

    await core.createNamespacedSecret(ns, secret);

    console.log(`Created secret ${secretName}`);

    const env = formatK8sEnv(secrets, secretName);

    return { env, variables: secrets, secretName };
  } catch (err) {
    console.error("Error creating secrets:", err);
    return { env: [], variables: {}, secretName: null };
  }
}
