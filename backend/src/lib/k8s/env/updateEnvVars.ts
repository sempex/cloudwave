import { V1EnvVar } from "@kubernetes/client-node";
import { createEnv } from "./createEnvVars.js";
import { core } from "../k8s.js";
import decodeObjectValues from "../../decodeObjectValues.js";

export async function addEnvVar(
  ns: string,
  secretName: string,
  secrets: { [key: string]: string }
) {
  try {
    const existingSecret = await core.readNamespacedSecret(secretName, ns);
    if (existingSecret && existingSecret.body)
      await core.deleteNamespacedSecret(secretName, ns);
    return await createEnv(ns, secretName, {
      ...existingSecret.body.stringData,
      ...secrets,
    });
  } catch (err) {
    return await createEnv(ns, secretName, secrets);
  }
}

export async function removeEnvVar(
  ns: string,
  secretName: string,
  secrets: string[]
) {
  const existingSecret = await core.readNamespacedSecret(secretName, ns);
  const exclude = new Set(secrets);

  if (!existingSecret.body.data) return { env: [], variables: {} };

  const data = decodeObjectValues(existingSecret.body.data);

  const newSecrets = Object.fromEntries(
    Object.entries(data).filter((e) => !exclude.has(e[0]))
  );

  return await createEnv(ns, secretName, newSecrets);
}
