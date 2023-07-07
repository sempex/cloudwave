import { V1EnvVar } from "@kubernetes/client-node";

export function formatK8sEnv(
  secrets: { [key: string]: string },
  secretName: string
): V1EnvVar[] {
  return Object.entries(secrets).map(([key, _]) => ({
    name: key,
    valueFrom: {
      secretKeyRef: {
        name: secretName,
        key: key,
      },
    },
  }));
}
