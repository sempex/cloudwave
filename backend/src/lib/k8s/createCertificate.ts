import { globalConfig } from "../config.js";
import { custom } from "./k8s.js";

/**
 * Create an SSL certificate for multiple domains using Cert-manager and Let's Encrypt.
 * @param domains An array of domains for which to create the certificate.
 * @param ns The namespace where the certificate should be created.
 * @param secretName The name of the secret to store the certificate.
 */
export async function createCertificate(
  domains: string[],
  ns: string,
  secretName: string
) {
  const existingCertificate = await getExistingCertificate(domains, ns);

  if (existingCertificate) {
    console.log(
      `Certificate for domains "${domains.join(
        ", "
      )}" already exists. Reusing "${existingCertificate}".`
    );
    return existingCertificate;
  }

  if (domains.length === 0) return null;

  await createClusterIssuerIfNotExists();

  const certificateSpec = {
    apiVersion: "cert-manager.io/v1",
    kind: "Certificate",
    metadata: {
      name: secretName,
      namespace: ns,
    },
    spec: {
      secretName: secretName,
      dnsNames: domains,
      issuerRef: {
        name: globalConfig.k8s.ssl.issuer,
        kind: "ClusterIssuer",
      },
    },
  };

  await custom.createNamespacedCustomObject(
    "cert-manager.io",
    "v1",
    ns,
    "certificates",
    certificateSpec
  );

  console.log(
    `Certificate for domains "${domains.join(
      ", "
    )}" created with name "${secretName}".`
  );
  return secretName;
}

/**
 * Create a Cert-manager ClusterIssuer if it doesn't exist.
 */
async function createClusterIssuerIfNotExists() {
  const issuerName = globalConfig.k8s.ssl.issuer;

  // Check if the ClusterIssuer already exists
  const existingIssuer = await getClusterIssuer(issuerName);

  if (!existingIssuer) {
    // Create the ClusterIssuer
    const issuerSpec = {
      apiVersion: "cert-manager.io/v1",
      kind: "ClusterIssuer",
      metadata: {
        name: issuerName,
      },
      spec: {
        acme: {
          server: "https://acme-v02.api.letsencrypt.org/directory",
          email: globalConfig.k8s.ssl.email, // Replace with your email address
          privateKeySecretRef: {
            name: issuerName,
          },
          solvers: [
            {
              http01: {
                ingress: {
                  class: "nginx",
                },
              },
            },
          ],
        },
      },
    };

    await custom.createClusterCustomObject(
      "cert-manager.io",
      "v1",
      "clusterissuers",
      issuerSpec
    );
  }
}

async function getClusterIssuer(issuerName: string) {
  try {
    const clusterIssuer = await custom.getClusterCustomObject(
      "cert-manager.io",
      "v1",
      "clusterissuers",
      issuerName
    );
    return clusterIssuer;
  } catch (error) {
    // ClusterIssuer doesn't exist
    return null;
  }
}

/**
 * Check if an existing Certificate matches the specified domains.
 * @param domains An array of domains to match.
 * @param ns The namespace where the Certificate is located.
 * @returns The name of the existing Certificate if found, otherwise null.
 */
async function getExistingCertificate(domains: string[], ns: string) {
  const certificates = await custom.listNamespacedCustomObject(
    "cert-manager.io",
    "v1",
    ns,
    "certificates"
  );

  for (const certificate of (certificates.body as any).items) {
    const certificateDomains = certificate.spec.dnsNames;
    if (
      domains.length === certificateDomains.length &&
      domains.every((domain) => certificateDomains.includes(domain))
    ) {
      return certificate.metadata.name;
    }
  }

  return null;
}
