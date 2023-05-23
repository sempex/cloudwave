import { Handler } from "express";

import { PushEvent } from "@octokit/webhooks-types";
import pushHandler from "../../lib/github/webhooks/pushHandler.js";
import { createdDeploymentHandler } from "../../lib/github/webhooks/deploymentHandler.js";

export const webhookHandler: Handler = async (req, res) => {
  switch (req.headers["x-github-event"]) {
    case "push":
      const success = await pushHandler(req.body as PushEvent);
      if (!success) res.status(500).send("error while creating deployment");
      return res.send("deployed");
    case "deployment":
      if (req.body.action !== "created") return res.send("Not create event");
      return (await createdDeploymentHandler(req.body))
        ? res.send("deployed to cluster")
        : res.status(500).send("No deployment startet on cluster");
    case "installation":
      res.send("installation updated");
      break;
    default:
      console.log("unhandled event", req.headers["x-github-event"]);
      res.send("ok");
  }
};
