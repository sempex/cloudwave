import { Handler } from "express";
import node from "../../lib/ci/pipelines/node.js";
import deploy from "../../lib/k8s/deploy.js";
import { z } from "zod";
import statusRes from "../../lib/stautsRes.js";

const schema = z.object({
  git: z.string().url(),
  name: z.string().min(5).max(20).toLowerCase(),
});

const post: Handler = async (req, res) => {
  try {
    const { git, name } = await schema.parseAsync({ ...req.body });
    const appPort = req.body.port;

    const image = await node(git, name);

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
