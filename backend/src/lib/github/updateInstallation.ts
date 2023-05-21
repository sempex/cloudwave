import { prisma } from "../db/prisma.js";

export const updateInstallation = async (email: string, id: number | null) => {
  const user = await prisma.user.update({
    where: {
      email: email,
    },
    data: {
      installationId: id,
    },
  });

  return user;
};
