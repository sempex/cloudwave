import decodeObjectValues from "../../decodeObjectValues.js";
import { core } from "../k8s.js";
import { formatK8sEnv } from "./formatK8sEnv.js";

export async function getEnvVars(ns: string, secretName: string) {
  const empty = { env: [], variables: [], secretName: secretName };
  try {
    const existingSecret = await core.readNamespacedSecret(secretName, ns);

    if (!existingSecret.body.data) return empty;

    const value = decodeObjectValues(existingSecret.body.data);

    return {
      env: formatK8sEnv(value, secretName),
      variables: value,
      secretName,
    };
  } catch (err) {
    return empty;
  }
}
