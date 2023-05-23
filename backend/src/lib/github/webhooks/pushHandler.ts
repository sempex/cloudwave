import { PushEvent } from "@octokit/webhooks-types";
import { prisma } from "../../db/prisma.js";
import { Response } from "express";
import { createDeployment } from "../deployment.js";

export default async function pushHandler(event: PushEvent) {
  const { ref, repository, installation } = event;

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
  });

  if (!project || !installation) return;

  await createDeployment(
    installation.id,
    repository.name,
    repository.owner.name || "",
    ref
  );

  return true;
}
