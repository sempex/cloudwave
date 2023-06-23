import { prisma } from "./db/prisma.js";
import { Branch } from "./github/getBranches.js";
import uniqueDomain from "./slug/generateUniqueDomain.js";

interface EnvProps {
  name: string;
  domain?: string;
  branch: Branch;
  projectId: string;
}

export default async function createEnv({
  branch,
  domain,
  name,
  projectId,
}: EnvProps) {
  const envName = await uniqueDomain(name + "-git-" + branch.name);

  const envDomain = `${envName.slug}.${process.env.DOMAIN}`;

  const env = await prisma.environment.create({
    data: {
      branch: branch.name,
      production: branch.main,

      domain: {
        create: {
          name: branch.main ? domain || envDomain : envDomain,
          default: true,
        },
      },
      project: {
        connect: {
          id: projectId,
        },
      },
    },
  });

  return env;
}
