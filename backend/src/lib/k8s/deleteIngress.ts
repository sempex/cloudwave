import { globalConfig } from "../config.js";
import { networking } from "./k8s.js";

export default async function deleteIngress(
  name: string,
  ns: string,
  environment?: string
) {
  try {
    await networking.deleteNamespacedIngress(
      `${environment ? environment + "-" : ""}${name}-${
        globalConfig.k8s.ingressSuffix
      }`,
      ns
    );
    return true;
  } catch {
    return false;
  }
}
