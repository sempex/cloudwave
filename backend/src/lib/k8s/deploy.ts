import { apps, networking, core } from "./k8s.js";
import { V1Deployment, V1Ingress, V1Secret } from "@kubernetes/client-node";
import nsExists from "./nsExists.js";
import createRegistrySecret from "./createRegistrySecret.js";
import { globalConfig } from "../config.js";

const DEFAULT_APP_PORT = 3000;

export default async function deploy(
  name: string,
  config: {
    image: string;
    userId: string;
    projectId: string;
    appPort?: number;
    secret?: {
      key: string;
      value: string;
    }[]
  }
) {
  const domain = process.env.DOMAIN;
  const appDomain = `${name}.${domain}`;

  const SECRET_NAME = "registry-creds";

  const namespaceSpec = {
    metadata: {
      name: config.userId,
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

  const ingressSpec: V1Ingress = {
    metadata: {
      name: `${name}-${globalConfig.k8s.ingressSuffix}`,
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
        },
      ],
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

  const ingress = await networking.createNamespacedIngress(
    namespaceSpec.metadata.name,
    ingressSpec
  );
    
  let secrets = []
  for (let i = 0; i < (config?.secret?.length || 0); i++ ) {
    const secretSpec: V1Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: config?.secret?.[i].key,
        namespace: namespaceSpec.metadata.name,
      },
      type: 'Opaque',
      data: config?.secret?.[i]
    }  
    const secret = await core.createNamespacedSecret(
        namespaceSpec.metadata.name,
        secretSpec
    );
    secrets.push(secret)
  }


  return {
    deployment,
    ingress,
    service,
    secrets,
    domain: appDomain,
  };
}
