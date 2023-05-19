import slugify from "slugify";
import { MOUNTAINS } from "./suffixes.js";
import { prisma } from "../db/prisma.js";
import { nanoid } from "nanoid";

export default async function uniqueDomain(base: string) {
  for (let i = 0; i <= 5; i++) {
    const slug = generateSlug(base);

    const exists = await prisma.domain.findUnique({
      where: {
        name: slug.slug,
      },
    });

    if (!exists) return slug;
  }

  const slug = generateSlug(base);

  return {
    slug: slug.slug + "-" + nanoid(5),
    urlSafeName: slug.urlSafeName,
  };
}

function generateSlug(base: string) {
  const safeBase = slugify.default(base, {
    replacement: "-",
    lower: true,
  });

  const mountain = MOUNTAINS[Math.floor(Math.random() * MOUNTAINS.length)];

  const suffix = slugify.default(mountain, {
    replacement: "-",
    lower: true,
  });

  return {
    slug: safeBase + "-" + suffix,
    urlSafeName: safeBase,
  };
}
