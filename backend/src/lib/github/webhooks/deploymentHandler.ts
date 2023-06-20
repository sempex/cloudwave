import {
  DeploymentCreatedEvent,
  DeploymentStatusEvent,
} from "@octokit/webhooks-types";
import { prisma } from "../../db/prisma.js";
import { Prisma } from "@prisma/client";
import { addBuildJob } from "../../queue/index.js";

export async function createdDeploymentHandler(event: DeploymentCreatedEvent) {
  addBuildJob(event);
  return true;
}

export const deploymentStateHandler = async (event: DeploymentStatusEvent) => {
  try {
    const { deployment_status, deployment } = event;
    const state = deployment_status.state;

    const dbDeployment = await prisma.deployment.update({
      where: {
        githubDeploymentId: deployment.id,
      },
      data: {
        state: state as Prisma.EnumStateFieldUpdateOperationsInput,
      },
    });

    return dbDeployment;
  } catch {
    return false;
  }
};
