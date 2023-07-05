import { V1Ingress } from "@kubernetes/client-node";
import { globalConfig } from "../config.js";
import { networking, custom } from "./k8s.js";
import { createCertificate } from "./createCertificate.js";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvw", 10);

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
  const id = `${environment ? environment + "-" : ""}${name}`;

  const ingressName = id + "-" + globalConfig.k8s.ingressSuffix;

  // Create a single SSL certificate for all domains (or reuse existing)
  const secretName = nanoid(5) + "-" + id + "-tls-secret";
  const certificateName = await createCertificate(domains, ns, secretName);

  const ingressSpec: V1Ingress = {
    metadata: {
      name: ingressName,
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
      tls: [
        {
          hosts: domains,
          secretName: certificateName,
        },
      ],
    },
  };

  const ingress = await networking.createNamespacedIngress(ns, ingressSpec);

  return {
    domains: domains,
  };
}