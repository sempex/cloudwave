import { apps, networking, core } from "./k8s.js";
import { V1Deployment, V1Ingress } from "@kubernetes/client-node";

export default async function deploy(
  name: string,
  image: string
) {
  const nameSpace = "default";

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
              image: image,
              ports: [
                {
                  containerPort: 3000,
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
          host: `${name}.cloudwave.local`,
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
          targetPort: 3000,
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
  };
}
