import { apps, networking, core } from "./k8s.js";
import { V1Deployment, V1Ingress } from "@kubernetes/client-node";
import nsExists from "./nsExists.js";
import createRegistrySecret from "./createRegistrySecret.js";
import { globalConfig } from "../config.js";

const DEFAULT_APP_PORT = 3000;

export default async function deploy(
  name: string,
  config: {
    image: string;
    namespace: string;
    appPort?: number;
  }
) {
  const SECRET_NAME = "registry-creds";

  const namespaceSpec = {
    metadata: {
      name: config.namespace,
    },
  };

  if (!(await nsExists(namespaceSpec.metadata.name))) {
    await core.createNamespace(namespaceSpec);
  }

  await createRegistrySecret(SECRET_NAME, namespaceSpec.metadata.name);

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
          imagePullSecrets: [
            {
              name: SECRET_NAME,
            },
          ],
        },
      },
    },
    metadata: {
      name: name,
    },
  };

  const serviceSpec = {
    metadata: {
      name: `${name}-${globalConfig.k8s.svcSuffix}`,
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
    namespaceSpec.metadata.name,
    deploymentSpec
  );

  const service = await core.createNamespacedService(
    namespaceSpec.metadata.name,
    serviceSpec
  );

  return {
    deployment,
    service,
  };
}
