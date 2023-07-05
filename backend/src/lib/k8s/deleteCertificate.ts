import { custom } from "./k8s.js";

/**
 * Delete a Cert-manager Certificate.
 * @param certificateName The name of the Certificate.
 * @param ns The namespace where the Certificate is located.
 */
export async function deleteCertificate(name: string, ns: string) {
  try {
    await custom.deleteNamespacedCustomObject(
      "cert-manager.io",
      "v1",
      ns,
      "certificates",
      name
    );
    console.log(`Certificate "${name}" deleted successfully.`);
  } catch (error) {
    console.error(`Failed to delete Certificate "${name}".`, error);
  }
}
