import { PushEvent } from "@octokit/webhooks-types";
import { prisma } from "../../db/prisma.js";
import { Response } from "express";
import { createDeployment } from "../deployment.js";

export default async function pushHandler(event: PushEvent) {
  const { ref, repository, installation, sender } = event;

  const project = await prisma.project.findFirst({
    where: {
      AND: [
        {
          User: {
            githubId: String(sender.id),
          },
        },
        { repository: repository.full_name },
      ],
    },
    include: {
      Domain: true,
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
