import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

import { Endpoints } from "@octokit/types";

export type ListBranchesResponse =
  Endpoints["GET /repos/{owner}/{repo}/branches"]["response"];

export const getInstallation = async (id: number) => {
  const secret = process.env.GITHUB_APP_SECRET.replace(/\\n/g, "\n");

  const appOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID,
      privateKey: secret,
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      // optional: this will make appOctokit authenticate as app (JWT)
      //           or installation (access token), depending on the request URL
      installationId: id,
    },
  });

  return appOctokit;
};
