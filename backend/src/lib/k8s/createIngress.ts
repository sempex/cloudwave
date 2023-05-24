import { V1Ingress } from "@kubernetes/client-node";
import { globalConfig } from "../config.js";
import { networking } from "./k8s.js";
/**
 *
 * @param param0 environment - Domains will be assigned to a specific environment and can be updated by the user. 
 * @returns
 */
export default async function createIngress({
  domains,
  name,
  environment,
  ns,
}: {
  name: string;
  domains: string[];
  environment?: string;
  ns: string;
}) {
  const ingressSpec: V1Ingress = {
    metadata: {
      name: `${environment ? environment + "-" : ""}${name}-${
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
