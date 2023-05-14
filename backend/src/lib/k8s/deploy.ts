import { apps, networking, core } from "./k8s.js";
import { V1Deployment, V1Ingress } from "@kubernetes/client-node";

const DEFAULT_APP_PORT = 3000

export default async function deploy(
  name: string,
  config: {
    image: string;
    appPort?: number;
  }
) {
  const nameSpace = "default";
  const domain = "cloudwave.local";
  const appDomain = `${name}.${domain}`;

  const deploymentSpec: V1Deployment = {
    spec: {
      selector: {
        matchLabels: {
          app: name,
        },
      },
      replicas: 1,
      template: {
        metadata: {
          labels: {
            app: name,
          },
        },
        spec: {
          containers: [
            {
              name: name,
              image: config.image,
              ports: [
                {
                  containerPort: config.appPort || DEFAULT_APP_PORT,
                },
              ],
            },
          ],
        },
      },
    },
    metadata: {
      name: name,
    },
  };

  const ingressSpec: V1Ingress = {
    metadata: {
      name: `${name}-ingress`,
    },
    spec: {
      ingressClassName: "nginx",
      rules: [
        {
          host: appDomain,
          http: {
            paths: [
              {
                backend: {
                  service: {
                    name: `${name}-svc`,
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
        },
      ],
    },
  };

  const serviceSpec = {
    metadata: {
      name: `${name}-svc`,
    },
    spec: {
      selector: {
        app: name,
      },
      ports: [
        {
          name: "http",
          port: 80,
          targetPort: config.appPort || DEFAULT_APP_PORT,
        },
      ],
      type: "ClusterIP",
    },
  };

  const deployment = await apps.createNamespacedDeployment(
    nameSpace,
    deploymentSpec
  );

  const service = await core.createNamespacedService(nameSpace, serviceSpec);

  const ingress = await networking.createNamespacedIngress(
    nameSpace,
    ingressSpec
  );

  return {
    deployment,
    ingress,
    service,
    domain: appDomain,
  };
}
