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
import {
  changeDeploymentState,
  createDeployment,
} from "../../lib/github/deployment.js";
import { V1Secret } from "@kubernetes/client-node";

export const webhookHandler: Handler = async (req, res) => {
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

      const githubDeployment = await createDeployment(
        req.body.installation.id,
        repository.name,
        repository.owner.name,
        ref
      );

      console.log(githubDeployment.data);

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
        secret: [{
          name: "mysecret",
          value: "1234qwer"
        }]
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

      // await changeDeploymentState(req.body.installation.id, {
      //   deploymentId: githubDeployment.data?.id,
      //   owner: repository.owner.name,
      //   repo: repository.name,
      //   state: "success",
      // });

      break;
    case "installation":
      res.send("installation updated");
      break;
    default:
      console.log("unhandled event", req.headers["x-github-event"]);
  }

  res.send("ok");
};