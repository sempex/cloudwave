import { Handler } from "express";
import { z } from "zod";
import statusRes from "../../../lib/stautsRes.js";
import { prisma } from "../../../lib/db/prisma.js";
import deleteIngress from "../../../lib/k8s/deleteIngress.js";
import createIngress from "../../../lib/k8s/createIngress.js";
import { Prisma } from "@prisma/client";
import hasProjectAccess from "../../../lib/access/hasProjectAccess.js";

const DOMAIN =
  /^(?!:\/\/)(?=.{1,255}$)((.{1,63}\.){1,127}(?![0-9]*$)[a-z0-9-]+\.?)$/;

const addSchema = z.object({
  domain: z.string().regex(DOMAIN, "Invalid FQDN"),
});

const paramsSchema = z.object({
  id: z.string().cuid(),
  envId: z.string(),
});

export const addDomainHandler: Handler = async (req, res) => {
  try {
    const { domain } = await addSchema.parseAsync(req.body);
    const { id, envId } = await paramsSchema.parseAsync(req.params);
    const user = res.locals.user;

    if (domain.endsWith(process.env.DOMAIN) && user.role !== "admin") {
      throw new Error("Official subdomain not allowed as custom domain");
    }

    const project = await prisma.project.update({
      where: {
        id: id,
      },
      data: {
        environment: {
          update: {
            where: {
              id: envId,
            },
            data: {
              domain: {
                create: {
                  name: domain,
                },
              },
            },
          },
        },
      },
      include: {
        environment: {
          where: {
            id: envId,
          },
          include: {
            deployment: {
              orderBy: {
                createdAt: "desc",
              },
            },
            domain: true,
          },
        },
      },
    });

    if (
      !(await hasProjectAccess("write", {
        projectId: project.id,
        userId: project.userId,
      }))
    )
      return res.status(401).send(statusRes("error", "Unauthorized"));

    const environment = project.environment[0];
    const deployment = environment.deployment[0];
    const ns = project.userId + "-" + project.id;

    try {
      //delete old ingress for project domains
      if (deployment.id) await deleteIngress(deployment.id, ns, environment.id);

      const domains = environment.domain
        .filter((d) => d.default)
        .map((d) => d.name);

      const tlsDomains = environment.domain
        .filter((d) => !d.default)
        .map((d) => d.name);

      //Set project domains to current deployment
      await createIngress({
        domains: domains,
        tlsDomains: tlsDomains,
        name: deployment.id,
        ns: ns,
        environment: environment.id,
      });
    } catch (e: any) {
      console.error(e);
      await prisma.domain.delete({
        where: {
          name: domain,
        },
      });
    }
    res.send(statusRes("success", "ok"));
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // The .code property can be accessed in a type-safe manner
      if (err.code === "P2002") {
        return res
          .status(400)
          .send(statusRes("error", "Domain already exists"));
      }
    } else {
      res.status(400).send(statusRes("error", err));
    }
  }
};

export const getDomainHandler: Handler = async (req, res) => {
  try {
    const { id } = await paramsSchema.parseAsync(req.params);

    const project = await prisma.project.findUnique({
      where: {
        id: id,
      },
      include: {
        environment: {
          include: {
            domain: true,
          },
        },
      },
    });

    if (!project) return res.status(404).send(statusRes("error", "Not found"));

    if (
      !(await hasProjectAccess("read", {
        projectId: project.id,
        userId: project.userId,
      }))
    )
      return res.status(401).send(statusRes("error", "Unauthorized"));

    res.send(
      project?.environment.reduce(
        (acc, curr) =>
          acc.concat(
            curr.domain.map((d) => ({
              ...d,
              prod: curr.production,
              env: curr.branch,
            }))
          ),
        [] as any[]
      )
    );
  } catch (err: any) {
    res.status(400).send(statusRes("error", err));
  }
};

export const deleteDomainHandler: Handler = async (req, res) => {
  try {
    const { domain } = await addSchema.parseAsync(req.body);
    const { id, envId } = await paramsSchema.parseAsync(req.params);

    const project = await prisma.project.update({
      where: {
        id: id,
      },
      data: {
        environment: {
          update: {
            where: {
              id: envId,
            },
            data: {
              domain: {
                delete: {
                  name: domain,
                },
              },
            },
          },
        },
      },
      include: {
        environment: {
          where: {
            id: envId,
          },
          include: {
            deployment: {
              orderBy: {
                createdAt: "desc",
              },
            },
            domain: true,
          },
        },
      },
    });

    if (
      !(await hasProjectAccess("write", {
        projectId: project.id,
        userId: project.userId,
      }))
    )
      return res.status(401).send(statusRes("error", "Unauthorized"));

    const environment = project.environment[0];
    const deployment = environment.deployment[0];
    const ns = project.userId + "-" + project.id;

    try {
      //delete old ingress for project domains
      if (deployment.id) await deleteIngress(deployment.id, ns, environment.id);

      const domains = environment.domain
        .filter((d) => d.default)
        .map((d) => d.name);

      const tlsDomains = environment.domain
        .filter((d) => !d.default)
        .map((d) => d.name);

      //Set project domains to current deployment
      await createIngress({
        domains: domains,
        tlsDomains: tlsDomains,
        name: deployment.id,
        ns: ns,
        environment: environment.id,
      });
    } catch (e: any) {
      await prisma.domain.delete({
        where: {
          name: domain,
        },
      });
    }
    res.send(statusRes("success", "ok"));
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // The .code property can be accessed in a type-safe manner
      if (err.code === "P2017") {
        return res
          .status(400)
          .send(statusRes("error", "Domain dose not exist"));
      }
    }
    res.status(400).send(statusRes("error", err));
  }
};
