import { getInstallation } from "./index.js";

export default async function createDeployment(
  installationId: number,
  repo: string,
  owner: string,
  ref: string
) {
  const octokit = await getInstallation(installationId);

  return octokit.request("GET /repos/{owner}/{repo}/deployments", {
    owner,
    repo,
    ref,
  });
}
