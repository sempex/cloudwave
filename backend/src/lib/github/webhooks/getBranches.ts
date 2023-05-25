import { getInstallation } from "../index.js";

const COMMON_DEFAULT_BRANCHES = ["master", "main"];

export const getBranches = async (
  repo: string,
  owner: string,
  installationId: number
) => {
  const octokit = await getInstallation(installationId);

  const { data } = await octokit.repos.listBranches({
    owner: owner,
    repo: repo,
  });

  const main = data.find((branch) =>
    COMMON_DEFAULT_BRANCHES.includes(branch.name)
  );

  const branches = data.map((branch) => ({
    ...branch,
    main: branch.name === main?.name,
  }));

  return branches;
};
