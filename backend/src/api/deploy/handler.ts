import { Handler } from "express";
import deploy from "../../lib/k8s/deploy.js";
import { z } from "zod";
import statusRes from "../../lib/stautsRes.js";
import {
  FrameworkType,
  FrameworkTypeOptionsEnum,
  frameworks,
} from "../../lib/ci/pipelines/frameworks.js";

const customParamsSchema = z
  .array(
    z.object({
      id: z.string(),
      value: z.string(),
    })
  )
  .optional();

export type CustomBuildParams = z.infer<typeof customParamsSchema>;

const schema = z.object({
  git: z.string().url(),
  name: z.string().min(5).max(20).toLowerCase(),
  appPort: z.number().max(65535).optional(),
  type: FrameworkTypeOptionsEnum,
  buildParameter: customParamsSchema,
});

const post: Handler = async (req, res) => {
  try {
    const { git, name, type, appPort, buildParameter } =
      await schema.parseAsync({
        ...req.body,
      });

    const framework = frameworks[type as FrameworkType];

    const image = await framework.builder({ git, name, buildParameter });

    if (!image) return res.status(500).send("Image url could not be retrieved");

    const deployment = await deploy(name, {
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
