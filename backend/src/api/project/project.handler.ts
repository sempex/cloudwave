import { Handler } from "express";
import { z } from "zod";
import statusRes from "../../lib/stautsRes.js";
import {
  FrameworkTypes,
  buildParameterValidators,
  frameworks,
} from "../../lib/ci/pipelines/frameworks.js";
import { prisma } from "../../lib/db/prisma.js";
import uniqueDomain from "../../lib/slug/generateUniqueDomain.js";
import { createDeployment } from "../../lib/github/deployment.js";
import { getInstallation } from "../../lib/github/index.js";
import { getBranches } from "../../lib/github/getBranches.js";
import createEnv from "../../lib/createEnv.js";
import { deleteNamespace } from "../../lib/k8s/deleteNamespace.js";

const schemaBase = z.object({
  repositoryName: z.string(),
  name: z.string().min(5).max(30),
  slug: z.string().max(30).optional(),
  appPort: z.number().max(65535).optional(),
  branch: z.string().optional().default("master"),
});

const schema = buildParameterValidators.and(schemaBase);

const post: Handler = async (req, res) => {
  try {
    const {
      repositoryName,
      name,
      type,
      slug,
      appPort,
      branch,
      buildParameters,
    } = await schema.parseAsync({
      ...req.body,
    });

    const subDomain = await uniqueDomain(slug || name);

    const domain = `${subDomain.slug}.${process.env.DOMAIN}`;

    const user = await prisma.user.findUnique({
      where: {
        id: res.locals.user.id,
      },
    });

    if (!user?.installationId)
      return res
        .status(500)
        .send(statusRes("error", "Missing installation ID"));

    const [owner, repo] = repositoryName.split("/");

    const branches = await getBranches(
      repo,
      owner,
      Number(user?.installationId)
    );

    const project = await prisma.project.create({
      data: {
        framework: type,
        displayName: name,
        slug: subDomain.slug,
        repository: repositoryName,
        port: appPort,
        User: {
          connect: {
            id: res.locals.user.id,
          },
        },
      },
      include: {
        User: true,
      },
    });

    if (!project.User.installationId)
      return res.status(400).send(statusRes("error", "No installation found"));

    const octokit = await getInstallation(Number(project.User.installationId));

    const installation = await octokit.apps.getAuthenticated();

    if (!installation.data.owner || !repo)
      return res
        .status(500)
        .send(
          statusRes("error", "Unable to retrieve github app installation name")
        );

    //create env for each branch
    for (const branch of branches) {
      const env = await createEnv({
        branch,
        domain: domain,
        name: slug || name,
        projectId: project.id,
      });

      await createDeployment(
        Number(project.User.installationId),
        repo,
        installation.data.owner.login,
        branch.name,
        env.production
      );
    }

    return res.send({
      project,
    });
  } catch (err: any) {
    res.status(400).send(statusRes("error", err));
  }
};

const idSchema = z.object({
  id: z.string().cuid(),
});

const deleteHandler: Handler = async (req, res) => {
  try {
    const { id } = await idSchema.parseAsync(req.params);
    const user = res.locals.user;

    const project = await prisma.project.findUnique({
      where: {
        id: id,
      },
    });

    if (!project) return res.status(404).send(statusRes("error", "Not found"));

    if (project.userId !== user.id && user.role !== "admin")
      return res.status(401).send(statusRes("error", "Unauthorized"));

    await deleteNamespace(`${project.userId}-${project.id}`);

    await prisma.project.delete({
      where: {
        id: id,
      },
    });

    return res.send(statusRes("success", "Deleted"));
  } catch (err: any) {
    res.status(400).send(statusRes("error", err));
  }
};

const getHandler: Handler = async (req, res) => {
  const { id } = await idSchema.parseAsync(req.params);
  const user = res.locals.user;

  const project = await prisma.project.findUnique({
    where: {
      id: id,
    },
  });

  if (!project) return res.status(404).send(statusRes("error", "Not found"));

  if (project.userId !== user.id && user.role !== "admin")
    return res.status(401).send(statusRes("error", "Unauthorized"));

  const framework = frameworks[project.framework as FrameworkTypes];

  return res.status(200).json({
    ...project,
    framework: {
      id: project.framework,
      displayName: framework.displayName,
      icon: framework.icon,
      buildOptions: framework.buildOptions,
    },
  });
};

export { post, deleteHandler, getHandler };
