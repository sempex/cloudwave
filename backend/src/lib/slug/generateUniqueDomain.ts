import slugify from "slugify";
import { MOUNTAINS } from "./suffixes.js";
import { prisma } from "../db/prisma.js";
import { nanoid } from "nanoid";

/**
 *
 * @param base Some name to be converted to a slug
 * @returns a unique slug and a non unique url safe name
 */
export default async function uniqueDomain(base: string) {
  const initialSlug = slugify.default(base, {
    replacement: "-",
    lower: true,
  });

  const exists = await prisma.domain.findUnique({
    where: {
      name: initialSlug,
    },
  });

  if (!exists) return { slug: initialSlug, urlSafeName: initialSlug };

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
