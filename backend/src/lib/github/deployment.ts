import { getInstallation } from "./index.js";

interface ChangeDeploymentStateConfig {
  deploymentId: number;
  repo: string;
  owner: string;
  logUrl?: string;
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
  ref: string,
  production?: boolean
) => {
  const octokit = await getInstallation(installationId);

  return octokit.repos.createDeployment({
    owner: owner,
    ref: ref,
    repo: repo,
    auto_merge: false,
    environment: production ? "production" : "preview",
  });
};

export const changeDeploymentState = async (
  installationId: number,
  config: ChangeDeploymentStateConfig
) => {
  const octokit = await getInstallation(installationId);
  const { deploymentId, repo, state, owner, logUrl } = config;

  return await octokit.repos.createDeploymentStatus({
    deployment_id: deploymentId,
    owner,
    repo,
    state,
    log_url: logUrl,
    auto_inactive: false,
  });
};
