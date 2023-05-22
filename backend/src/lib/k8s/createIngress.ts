import { V1Ingress } from "@kubernetes/client-node";
import { globalConfig } from "../config.js";
import { networking } from "./k8s.js";
/**
 *
 * @param param0 main - If ingress has the domains set in the project and not only commit domain
 * @returns
 */
export default async function createIngress({
  domains,
  name,
  main,
  ns,
}: {
  name: string;
  domains: string[];
  main?: boolean;
  ns: string;
}) {
  const ingressSpec: V1Ingress = {
    metadata: {
      name: `${main ? "custom-domain-" : ""}${name}-${
        globalConfig.k8s.ingressSuffix
      }`,
    },
    spec: {
      ingressClassName: "nginx",
      rules: domains.map((domain) => ({
        host: domain,
        http: {
          paths: [
            {
              backend: {
                service: {
                  name: `${name}-${globalConfig.k8s.svcSuffix}`,
                  port: {
                    number: 80,
                  },
                },
              },
              path: "/",
              pathType: "Prefix",
            },
          ],
        },
      })),
    },
  };

  const ingress = await networking.createNamespacedIngress(ns, ingressSpec);

  return {
    domains: domains,
  };
}
