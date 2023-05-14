import { apps, networking, core } from "./k8s.js";
import { V1Deployment, V1Ingress } from "@kubernetes/client-node";

export default async function deploy(
  name: string,
  container: { name: string; image: string }
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
              name: container.name,
              image: container.image,
              ports: [
                {
                  containerPort: 80,
                },
              ],
            },
          ],
        },
      },
    },
    metadata: {
      name: "my-deployment",
    },
  };

  const ingressSpec: V1Ingress = {
    apiVersion: "networking.k8s.io/v1",
    kind: "Ingress",
    metadata: {
      name: `ingress-${name}`,
      labels: {
        createdBy: "node-client",
      },
      annotations: {
        "meta.helm.sh/release-namespace": "production-auto-deploy",
      },
    },
    spec: {
      ingressClassName: "nginx",
      rules: [
        {
          host: `${name}`,
          http: {
            paths: [
              {
                backend: {
                  service: {
                    name: `svc-${name}`,
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
      name: `svc-${name}`,
    },
    spec: {
      selector: {
        app: name,
      },
      ports: [
        {
          name: "http",
          port: 80,
          targetPort: 80,
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
