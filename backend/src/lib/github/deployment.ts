import { getInstallation } from "./index.js";

interface ChangeDeploymentStateConfig {
  deploymentId: number;
  repo: string;
  owner: string;
  state:
    | "error"
    | "failure"
    | "inactive"
    | "in_progress"
    | "queued"
    | "pending"
    | "success";
}

export const createDeployment = async (
  installationId: number,
  repo: string,
  owner: string,
  ref: string
) => {
  const octokit = await getInstallation(installationId);

  return octokit.repos.createDeployment({
    owner: owner,
    ref: ref,
    repo: repo,
  });
};

export const changeDeploymentState = async (
  installationId: number,
  config: ChangeDeploymentStateConfig
) => {
  const octokit = await getInstallation(installationId);
  const { deploymentId, repo, state, owner } = config;

  return await octokit.repos.createDeploymentStatus({
    deployment_id: deploymentId,
    owner,
    repo,
    state,
  });
};
