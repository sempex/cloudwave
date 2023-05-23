import { InstallationEvent } from "@octokit/webhooks-types";
import { prisma } from "../../db/prisma.js";

export async function installationHandler(event: InstallationEvent) {
  const { action, installation, sender } = event;

  if (action == "deleted") {
    return await prisma.user.update({
      where: {
        installationId: String(installation.id),
      },
      data: {
        installationId: null,
      },
    });
  }

  if (action === "created") {
    return await prisma.user.update({
      where: {
        githubId: String(sender.id),
      },
      data: {
        installationId: String(installation.id),
      },
    });
  }
}
