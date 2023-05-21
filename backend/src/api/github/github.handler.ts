import { Handler } from "express";
import { prisma } from "../../lib/db/prisma.js";
import {
  FrameworkTypes,
  frameworks,
} from "../../lib/ci/pipelines/frameworks.js";
import deploy from "../../lib/k8s/deploy.js";
import { globalConfig } from "../../lib/config.js";
import { getInstallation } from "../../lib/github/index.js";
import { updateInstallation } from "../../lib/github/updateInstallation.js";

export const webhookHandler: Handler = async (req, res) => {
  const { installation } = req.body;

  const octokit = await getInstallation(installation.id);

  switch (req.headers["x-github-event"]) {
    case "push":
      const { ref, repository, head_commit } = req.body;

      const branch = ref.split("/").at(-1);

      const project = await prisma.project.findFirst({
        where: {
          repository: repository.full_name,
        },
      });

      if (!project) return res.status(500).send("Repo not registered");

      const framework = frameworks[project?.framework as FrameworkTypes];

      const subdomain =
        `${repository.owner.name}-${head_commit.id}-${branch}`.toLowerCase();

      const image = await framework.builder({
        git: globalConfig.git.githubBaseUrl + "/" + repository.full_name,
        name: subdomain,
        branch,
      });

      if (!image)
        return res.status(500).send("Image url could not be retrieved");

      const deployment = await deploy(subdomain, {
        userId: project.userId,
        projectId: project.id,
        image: image,
      });

      const dbDeployment = await prisma.deployment.create({
        data: {
          branch: branch,
          primary: false,
          commit: head_commit.id,
          Domain: {
            create: {
              name: `${subdomain}.${process.env.DOMAIN}`,
            },
          },
          Project: {
            connect: {
              id: project.id,
            },
          },
        },
      });

      console.log(dbDeployment);

      break;
    case "installation":
      const { installation, action } = req.body;

      if (action === "created")
        await updateInstallation("Eon.sberk@gmail.com", installation.id);
      if (action === "deleted")
        await updateInstallation("Eon.sberk@gmail.com", null);

      res.send("installation updated");
      break;
    default:
      console.log("unhandled event", req.headers["x-github-event"]);
  }

  res.send("ok");
};
