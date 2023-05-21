import { Handler } from "express";
import deploy from "../../lib/k8s/deploy.js";
import { z } from "zod";
import statusRes from "../../lib/stautsRes.js";
import {
  FrameworkTypes,
  buildParameterValidators,
  frameworks,
} from "../../lib/ci/pipelines/frameworks.js";
import { prisma } from "../../lib/db/prisma.js";
import uniqueDomain from "../../lib/slug/generateUniqueDomain.js";

const schemaBase = z.object({
  git: z.string(),
  name: z.string().min(5).max(30),
  slug: z.string().max(30).optional(),
  appPort: z.number().max(65535).optional(),
  branch: z.string().optional().default("master"),
});

const schema = buildParameterValidators.and(schemaBase);

const post: Handler = async (req, res) => {
  try {
    const { git, name, type, slug, appPort, branch, buildParameters } =
      await schema.parseAsync({
        ...req.body,
      });

    const framework = frameworks[type as FrameworkTypes];

    const subDomain = await uniqueDomain(slug || name);

    const project = await prisma.project.create({
      data: {
        framework: type,
        displayName: name,
        git: git,
        Deployment: {
          create: {
            branch: branch,
            primary: true,
            Domain: {
              create: {
                name: `${subDomain.slug}.${process.env.DOMAIN}`,
                default: true,
              },
            },
          },
        },
        User: {
          connect: {
            id: res.locals.user.id,
          },
        },
      },
    });

    const image = await framework.builder({
      git,
      name: subDomain.slug,
      branch,
      buildParameters,
    });

    if (!image) return res.status(500).send("Image url could not be retrieved");

    const deployment = await deploy(subDomain.slug, {
      userId: res.locals.user.id,
      projectId: project.id,
      image: image,
      appPort: appPort,
    });

    res.send({
      url: "https://" + deployment.domain,
    });
  } catch (err: any) {
    res.status(400).send(statusRes("error", err));
  }
};

export { post };
