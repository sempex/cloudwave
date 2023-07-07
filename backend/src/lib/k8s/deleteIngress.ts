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
  const tlsIngressName = id + "-" + globalConfig.k8s.tlsIngressSuffix;
  const secretName = id + "-tls-secret";

  try {
    await networking.deleteNamespacedIngress(ingressName, ns);
    console.log(`Ingress "${ingressName}" deleted.`);
  } catch (err) {
    console.log(`Ingress "${ingressName}" not deleted.`);
  }

  try {
    await networking.deleteNamespacedIngress(tlsIngressName, ns);
    console.log(`Ingress "${tlsIngressName}" deleted.`);
  } catch (err) {
    console.log(`Ingress "${tlsIngressName}" not deleted.`);
  }

  if (deleteCert) await deleteCertificate(secretName, ns);

  return true;
}
