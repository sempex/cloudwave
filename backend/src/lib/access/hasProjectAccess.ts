import { AccessLevel, Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";

enum AccessLevelValue {
  read = 1,
  write = 2,
  admin = 3,
}

export default async function hasProjectAccess(
  accessRequired: AccessLevel,
  options: { userId: string; projectId: string }
) {
  const project = await prisma.project.findUnique({
    where: {
      id: options.projectId,
    },
    include: {
      acl: true,
    },
  });

  if (!project) return false;

  const userAccess = project.acl.find((acl) => acl.userId === options.userId);

  if (project.userId === options.userId) return true;
  
  if (await isSysAdmin(project.userId)) return true;

  if (!userAccess) return false;

  return AccessLevelValue[userAccess.role] >= AccessLevelValue[accessRequired];
}

export async function isSysAdmin(id: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });

  return user?.role === "admin";
}

export async function getProjectAccess(options: {
  userId: string;
  projectId: string;
}) {
  const project = await prisma.project.findUnique({
    where: {
      id_userId: {
        id: options.projectId,
        userId: options.userId,
      },
    },
    include: {
      acl: {
        where: {
          userId: options.userId,
        },
      },
    },
  });

  if (!project) return;

  const acl = project.acl.at(0);

  return project.userId === options.userId ? "admin" : acl?.role;
}
