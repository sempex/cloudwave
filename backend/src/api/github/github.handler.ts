import { Handler } from "express";
import { prisma } from "../../lib/db/prisma.js";
import {
  FrameworkTypes,
  frameworks,
} from "../../lib/ci/pipelines/frameworks.js";
import deploy from "../../lib/k8s/deploy.js";

export const webhookHandler: Handler = async (req, res) => {
  switch (req.headers["x-github-event"]) {
    case "push":
      const { ref, repository, head_commit } = req.body;

      const branch = ref.split("/").at(-1);

      const project = await prisma.project.findFirst({
        where: { git: repository.full_name },
      });

      if (!project) return;

      const framework = frameworks[project?.framework as FrameworkTypes];

      console.log(framework);

      const subdomain =
        `${repository.owner.name}-${head_commit.id}-${branch}`.toLowerCase();

      console.log(project);

      const image = await framework.builder({
        git: repository.full_name,
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

      console.log(subdomain);

      break;
    default:
      console.log("unhandled event");
  }

  res.send("ok");
};
