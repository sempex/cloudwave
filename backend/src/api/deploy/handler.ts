import { Handler } from "express";
import node from "../../lib/ci/pipelines/node.js";
import deploy from "../../lib/k8s/deploy.js";

const post: Handler = async (req, res) => {
  const appName = req.body.name;
  const git = req.body.git;

  if (!appName) res.status(400).send("please supply a appName");
  if (!git) res.status(400).send("please supply a git repo");

  const appPort = req.body.port;

  const image = await node(git, appName);

  if (!image) return res.status(500).send("Image url could not be retrieved");

  const deployment = await deploy(appName, {
    image: image,
    appPort: appPort,
  });

  res.send({
    url: "https://" + deployment.domain,
  });
};

export { post };
