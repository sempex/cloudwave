import { DeploymentCreatedEvent } from "@octokit/webhooks-types";
import { FrameworkTypes, frameworks } from "../../ci/pipelines/frameworks.js";
import { prisma } from "../../db/prisma.js";
import deploy from "../../k8s/deploy.js";
import { globalConfig } from "../../config.js";
import createIngress from "../../k8s/createIngress.js";
import deleteIngress from "../../k8s/deleteIngress.js";

import { changeDeploymentState } from "../../github/deployment.js";
import { customAlphabet } from "nanoid";
import { getInstallation } from "../../github/index.js";

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvw", 10);

export default async function buildJob(event: DeploymentCreatedEvent) {
  const { repository, installation, sender, deployment } = event;

  if (!installation) return;

  const octokit = await getInstallation(installation?.id);

  const { data: branch } = await octokit.repos.getBranch({
    branch: deployment.ref,
    repo: repository.name,
    owner: repository.owner.login,
  });

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

  if (!project) {
    console.error("Invalid project");
    return false;
  }

  const framework = frameworks[project?.framework as FrameworkTypes];

  const subdomain = `${project.slug}-${nanoid(7)}-git`.toLowerCase();

  const commitDomain = subdomain + "." + process.env.DOMAIN;

  const lastDeployment = await prisma.deployment.findFirst({
    where: {
      environment: {
        branch: branch.name,
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
            branch: branch.name,
          },
          create: {
            branch: branch.name,
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
  const ns = `${project.userId}-${project.id}`;

  const image = await framework.builder({
    git: globalConfig.git.githubBaseUrl + "/" + repository.full_name,
    name: subdomain,
    branch: branch.name,
  });

  if (!image) {
    console.error("No image");
    return false;
  }

  await deploy(deploymentName, {
    namespace: ns,
    appPort: project.port,
    image: image,
  });

  //delete old ingress for project domains
  if (lastDeployment)
    await deleteIngress(
      deploymentName,
      ns,
      dbDeployment.environment.id
    );
  //Set project domains to current deployment
  await createIngress({
    domains: dbDeployment.environment.domain.map((d) => d.name),
    name: deploymentName,
    ns: ns,
    environment: dbDeployment.environment.id,
  });

  //Create commit specific domain
  await createIngress({
    domains: [commitDomain],
    name: deploymentName,
    ns: ns,
  });

  await changeDeploymentState(installation?.id || 0, {
    //@ts-ignore
    deploymentId: deployment.id,
    owner: repository.owner.login,
    repo: repository.name,
    logUrl: "https://" + commitDomain,
    state: "success",
  });
}
