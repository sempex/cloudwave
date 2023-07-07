import { apps, networking, core } from "./k8s.js";
import { V1Deployment, V1Ingress } from "@kubernetes/client-node";
import nsExists from "./nsExists.js";
import createRegistrySecret from "./createRegistrySecret.js";
import { globalConfig } from "../config.js";
import { getEnvVars } from "./env/getEnvVars.js";
import { prisma } from "../db/prisma.js";

const DEFAULT_APP_PORT = 3000;

export default async function deploy(
  name: string,
  config: {
    image: string;
    namespace: string;
    environmentId: string;
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

  const envSecretName = `${config.environmentId}-${globalConfig.k8s.evnSecretSuffix}`;

  const { env, variables } = await getEnvVars(
    namespaceSpec.metadata.name,
    envSecretName
  );

  console.log(variables);

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
              env: [
                ...env,
                {
                  name: "SHIPER_ENVIRONMENT_ID",
                  value: config.environmentId,
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

  await prisma.environment.update({
    where: {
      id: config.environmentId,
    },
    data: {
      secretName: envSecretName,
    },
  });

  return {
    deployment,
    service,
    envName: envSecretName,
  };
}
