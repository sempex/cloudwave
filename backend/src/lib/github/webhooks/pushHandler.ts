import { PushEvent } from "@octokit/webhooks-types";
import { prisma } from "../../db/prisma.js";
import { Response } from "express";
import { createDeployment } from "../deployment.js";
import createEnv from "../../createEnv.js";
import { getInstallation } from "../index.js";

export default async function pushHandler(event: PushEvent) {
  const { ref, repository, installation } = event;

  if (!installation) return;

  const octokit = await getInstallation(installation?.id);

  const { data: branch } = await octokit.repos.getBranch({
    branch: ref,
    repo: repository.name,
    owner: repository.owner.login,
  });

  const project = await prisma.project.findFirst({
    where: {
      AND: [
        {
          User: {
            installationId: String(installation?.id),
          },
        },
        { repository: repository.full_name },
      ],
    },
    include: {
      environment: {
        where: {
          branch: branch.name,
        },
      },
    },
  });

  if (!project || !installation) return;

  const env = project.environment.at(0);

  if (!env) {
    await createEnv({
      branch: { ...branch, main: false },
      name: project.slug,
      projectId: project.id,
    });
  }

  try {
    await createDeployment(
      installation.id,
      repository.name,
      repository.owner.name || "",
      ref,
      env?.production
    );
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}
