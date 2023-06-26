import { globalConfig } from "../config.js";
import { changeDeploymentState } from "../github/deployment.js";
import deleteIngress from "./deleteIngress.js";
import { apps, core } from "./k8s.js";

export default async function deleteDeployment(name: string, ns: string) {
  await core.deleteNamespacedService(
    `${name}-${globalConfig.k8s.svcSuffix}`,
    ns
  );
  await deleteIngress(name, ns);
  await apps.deleteNamespacedDeployment(name, ns);
}
