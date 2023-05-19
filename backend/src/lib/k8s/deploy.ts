import { apps, networking, core } from "./k8s.js";
import { V1Deployment, V1Ingress } from "@kubernetes/client-node";
import nsExists from "./nsExists.js";

const DEFAULT_APP_PORT = 3000;

export default async function deploy(
  name: string,
  config: {
    image: string;
    userId: string;
    projectId: string;
    appPort?: number;
  }
) {
  const domain = process.env.DOMAIN;
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

  const namespaceSpec = {
    metadata: {
      name: config.projectId + "-" + config.userId,
    },
  };  

  if (!await nsExists(namespaceSpec.metadata.name)){
    await core.createNamespace(namespaceSpec);
  }

  const deployment = await apps.createNamespacedDeployment(
    namespaceSpec.metadata.name,
    deploymentSpec
  );

  const service = await core.createNamespacedService(
    namespaceSpec.metadata.name,
    serviceSpec
  );

  const ingress = await networking.createNamespacedIngress(
    namespaceSpec.metadata.name,
    ingressSpec
  );

  return {
    deployment,
    ingress,
    service,
    domain: appDomain,
  };
}
