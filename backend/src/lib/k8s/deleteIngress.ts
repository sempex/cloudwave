import { globalConfig } from "../config.js";
import { deleteCertificate } from "./deleteCertificate.js";
import { networking } from "./k8s.js";

export default async function deleteIngress(
  name: string,
  ns: string,
  environment?: string,
  deleteCert?: boolean
) {
  const id = `${environment ? environment + "-" : ""}${name}`;

  const ingressName = id + "-" + globalConfig.k8s.ingressSuffix;
  const secretName = id + "-tls-secret";

  try {
    await networking.deleteNamespacedIngress(ingressName, ns);
    if (deleteCert) await deleteCertificate(secretName, ns);
    return true;
  } catch {
    return false;
  }
}
