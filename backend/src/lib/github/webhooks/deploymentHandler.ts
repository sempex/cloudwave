import {
  DeploymentCreatedEvent,
  DeploymentStatusEvent,
  PushEvent,
} from "@octokit/webhooks-types";
import { changeDeploymentState } from "../deployment.js";
import { FrameworkTypes, frameworks } from "../../ci/pipelines/frameworks.js";
import { prisma } from "../../db/prisma.js";
import { Response } from "express";
import { customAlphabet } from "nanoid";
import deploy from "../../k8s/deploy.js";
import { globalConfig } from "../../config.js";
import createIngress from "../../k8s/createIngress.js";
import deleteIngress from "../../k8s/deleteIngress.js";
import { Prisma } from "@prisma/client";

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvw", 10);

export async function createdDeploymentHandler(event: DeploymentCreatedEvent) {
  const { repository, installation, sender, deployment } = event;

  const branch = deployment.ref.split("/").at(-1) || "master";

  const project = await prisma.project.findFirst({
    where: {
      AND: [
        {
          repository: repository.full_name,
          User: {
            installationId: String(installation?.id),
          },
        },
      ],
    },
  });

  if (!project) return false;

  const framework = frameworks[project?.framework as FrameworkTypes];

  const subdomain = `${project.slug}-${nanoid(7)}-git`.toLowerCase();

  const commitDomain = subdomain + "." + process.env.DOMAIN;

  const lastDeployment = await prisma.deployment.findFirst({
    where: {
      environment: {
        branch: branch,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const dbDeployment = await prisma.deployment.create({
    data: {
      primary: false,
      githubDeploymentId: deployment.id,
      defaultDomain: commitDomain,
      state: "in_progress",
      environment: {
        connectOrCreate: {
          where: {
            branch: branch,
          },
          create: {
            branch: branch,
            production: false,
            project: {
              connect: {
                id: project.id,
              },
            },
          },
        },
      },
    },
    include: {
      environment: {
        include: {
          domain: true,
        },
      },
    },
  });

  const deploymentName = dbDeployment.id;

  const image = await framework.builder({
    git: globalConfig.git.githubBaseUrl + "/" + repository.full_name,
    name: subdomain,
    branch,
  });

  if (!image) return false;

  await deploy(deploymentName, {
    namespace: project.userId,
    appPort: project.port,
    image: image,
  });

  //delete old ingress for project domains
  if (lastDeployment)
    await deleteIngress(
      lastDeployment?.id,
      project.userId,
      dbDeployment.environment.branch
    );

  //Set project domains to current deployment
  await createIngress({
    domains: dbDeployment.environment.domain.map((d) => d.name),
    name: dbDeployment.id,
    ns: project.userId,
    environment: dbDeployment.environment.branch,
  });

  //Create commit specific domain
  await createIngress({
    domains: [commitDomain],
    name: deploymentName,
    ns: project.userId,
  });

  await changeDeploymentState(installation?.id || 0, {
    //@ts-ignore
    deploymentId: deployment.id,
    owner: repository.owner.login,
    repo: repository.name,
    logUrl: "https://" + commitDomain,
    state: "success",
  });

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
