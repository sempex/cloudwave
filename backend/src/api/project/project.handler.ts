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
import createIngress from "../../lib/k8s/createIngress.js";

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

    const domain = `${subDomain.slug}.${process.env.DOMAIN}`;

    const project = await prisma.project.create({
      data: {
        framework: type,
        displayName: name,
        slug: subDomain.slug,
        repository: repositoryName,
        Deployment: {
          create: {
            branch: branch,
            primary: true,
          },
        },
        Domain: {
          create: {
            name: domain,
            default: true,
          },
        },
        User: {
          connect: {
            id: res.locals.user.id,
          },
        },
      },
      include: {
        Deployment: true,
      },
    });

    const image = await framework.builder({
      git: gitUrl,
      name: subDomain.slug,
      branch,
      buildParameters,
    });

    if (!image) return res.status(500).send("Image url could not be retrieved");

    const deployment = await deploy(project.Deployment[0].id, {
      namespace: res.locals.user.id,
      image: image,
      appPort: appPort,
    });

    const ingress = await createIngress({
      ns: res.locals.user.id,
      domains: [domain],
      main: true,
      name: project.Deployment[0].id,
    });

    res.send({
      url: "https://" + ingress.domains[0],
    });
  } catch (err: any) {
    res.status(400).send(statusRes("error", err));
  }
};

export { post };
