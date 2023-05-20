/**
 * Creates a secret if it dose not yet exist
 * @param secretName name of the secret
 * @param namespace the namespace the secret should be created in
 * @param data the data saved in the secret
 * @returns If a new secret was created returns true, if it exists returns false
 */

import { V1Secret } from "@kubernetes/client-node";
import { core } from "./k8s.js";

export default async function createRegistrySecret(
  secretName: string,
  namespace: string
): Promise<boolean> {
  try {
    // Check if the secret already exists
    await core.readNamespacedSecret(secretName, namespace);
    await core.deleteNamespacedSecret(secretName, namespace);
  } catch (err) {
    // First time secret will be created
  }

  const secretData = {
    ".dockerconfigjson": Buffer.from(
      JSON.stringify({
        auths: {
          [process.env.REGISTRY_URL]: {
            username: process.env.REGISTRY_USERNAME,
            password: process.env.REGISTRY_PASSWORD,
            auth: Buffer.from(
              `${process.env.REGISTRY_USERNAME}:${process.env.REGISTRY_PASSWORD}`
            ).toString("base64"),
          },
        },
      })
    ).toString("base64"),
  };
  // Secret doesn't exist, create it
  const secret: V1Secret = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: secretName,
      namespace,
    },
    type: "kubernetes.io/dockerconfigjson",
    data: secretData,
  };

  await core.createNamespacedSecret(namespace, secret);
  return true;
}
