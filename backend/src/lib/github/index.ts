import { App } from "@octokit/app";

export const getInstallation = async (id: number) => {
  const secret = process.env.GITHUB_APP_SECRET.replace(/\\n/g, "\n");

  console.log(secret);

  console.log(id);

  try {
    const app = new App({
      appId: process.env.GITHUB_APP_ID,
      privateKey: secret,
    });

    return await app.getInstallationOctokit(id);
  } catch (err: any) {
    console.log(err);

    return;
  }
};
