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
import { globalConfig } from "../../lib/config.js";

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

    const gitUrl = globalConfig.git.githubBaseUrl + "/" + repositoryName;

    const framework = frameworks[type as FrameworkTypes];

    const subDomain = await uniqueDomain(slug || name);

    const project = await prisma.project.create({
      data: {
        framework: type,
        displayName: name,
        repository: repositoryName,
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
      git: gitUrl,
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
      secret: [{key: "zero", value: "password"}, {key: "huan", value:"ming"}]
    });

    res.send({
      url: "https://" + deployment.domain,
    });
  } catch (err: any) {
    res.status(400).send(statusRes("error", err));
  }
};

export { post };
