import { Handler } from "express";
import { z } from "zod";
import statusRes from "../../lib/stautsRes.js";
import { buildParameterValidators } from "../../lib/ci/pipelines/frameworks.js";
import { prisma } from "../../lib/db/prisma.js";
import uniqueDomain from "../../lib/slug/generateUniqueDomain.js";
import { createDeployment } from "../../lib/github/deployment.js";
import { getInstallation } from "../../lib/github/index.js";
import { getBranches } from "../../lib/github/webhooks/getBranches.js";

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
      const envName = await uniqueDomain(
        (slug || name) + "-git-" + branch.name
      );

      const envDomain = `${envName.slug}.${process.env.DOMAIN}`;

      const env = await prisma.environment.create({
        data: {
          branch: branch.name,
          production: branch.main,

          domain: {
            create: {
              name: branch.main ? domain : envDomain,
              default: true,
            },
          },
          project: {
            connect: {
              id: project.id,
            },
          },
        },
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

export { post };
