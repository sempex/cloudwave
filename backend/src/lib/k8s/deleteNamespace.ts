import { core } from "./k8s.js";

/**
 * Deletes a Kubernetes namespace with the given ID.
 * @param {string} namespace - The ID of the namespace to delete.
 * @returns {Promise<void>} A Promise that resolves when the namespace is deleted successfully.
 */
export async function deleteNamespace(namespace: string) {
  try {
    // Delete the namespace
    await core.deleteNamespace(namespace);

    console.log(`Namespace '${namespace}' deleted successfully.`);
  } catch (err) {
    console.error("Error deleting namespace:", err);
  }
}
