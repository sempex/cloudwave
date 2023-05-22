import { globalConfig } from "../config.js";
import { networking } from "./k8s.js";

export default async function deleteIngress(
  name: string,
  ns: string,
  main: boolean
) {
  try {
    await networking.deleteNamespacedIngress(
      `${main ? "custom-domain-" : ""}${name}-${
        globalConfig.k8s.ingressSuffix
      }`,
      ns
    );
    return true;
  } catch {
    return false;
  }
}
