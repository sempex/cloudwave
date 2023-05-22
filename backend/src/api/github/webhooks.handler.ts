import { Handler } from "express";
import { prisma } from "../../lib/db/prisma.js";
import {
  FrameworkTypes,
  frameworks,
} from "../../lib/ci/pipelines/frameworks.js";
import deploy from "../../lib/k8s/deploy.js";
import { globalConfig } from "../../lib/config.js";
import {
  changeDeploymentState,
  createDeployment,
} from "../../lib/github/deployment.js";
import deleteIngress from "../../lib/k8s/deleteIngress.js";
import createIngress from "../../lib/k8s/createIngress.js";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvw", 10);

export const webhookHandler: Handler = async (req, res) => {
  switch (req.headers["x-github-event"]) {
    case "push":
      const { ref, repository, head_commit } = req.body;

      const branch = ref.split("/").at(-1);

      const project = await prisma.project.findFirst({
        where: {
          repository: repository.full_name,
        },
        include: {
          Domain: true,
        },
      });

      if (!project) return res.status(500).send("Repo not registered");

      const githubDeployment = await createDeployment(
        req.body.installation.id,
        repository.name,
        repository.owner.name,
        ref
      );

      console.log(githubDeployment.data);

      const framework = frameworks[project?.framework as FrameworkTypes];

      const subdomain = `${project.slug}-${nanoid(7)}-${branch}`.toLowerCase();

      const commitDomain = subdomain + "." + process.env.DOMAIN;

      const image = await framework.builder({
        git: globalConfig.git.githubBaseUrl + "/" + repository.full_name,
        name: subdomain,
        branch,
      });

      if (!image)
        return res.status(500).send("Image url could not be retrieved");

      const lastDeployment = await prisma.deployment.findFirst({
        where: {
          branch: branch,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const dbDeployment = await prisma.deployment.create({
        data: {
          branch: branch,
          primary: false,
          commit: head_commit.id,
          Project: {
            connect: {
              id: project.id,
            },
          },
        },
      });

      //delete old ingress for project domains
      if (lastDeployment)
        await deleteIngress(lastDeployment?.id, project.userId, true);

      //Set project domains to current deployment
      await createIngress({
        domains: project.Domain.map((d) => d.name),
        name: dbDeployment.id,
        ns: project.userId,
        main: true,
      });

      const deploymentName = dbDeployment.id;

      //Create commit specific domain
      await createIngress({
        domains: [commitDomain],
        name: deploymentName,
        ns: project.userId,
        main: false,
      });

      const deployment = await deploy(deploymentName, {
        namespace: project.userId,
        image: image,
      });

      if (githubDeployment.data)
        await changeDeploymentState(req.body.installation.id, {
          //@ts-ignore
          deploymentId: githubDeployment.data.id,
          owner: repository.owner.name,
          repo: repository.name,
          logUrl: "https://" + commitDomain,
          state: "success",
        });
      res.send("deployed");
      break;
    case "installation":
      res.send("installation updated");
      break;
    default:
      console.log("unhandled event", req.headers["x-github-event"]);
  }

  res.send("ok");
};
