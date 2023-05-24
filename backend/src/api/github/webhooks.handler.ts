import { Handler } from "express";

import { PushEvent } from "@octokit/webhooks-types";
import pushHandler from "../../lib/github/webhooks/pushHandler.js";
import { createdDeploymentHandler } from "../../lib/github/webhooks/deploymentHandler.js";
import { installationHandler } from "../../lib/github/webhooks/installationHandler.js";

export const webhookHandler: Handler = async (req, res) => {
  const event = req.headers["x-github-event"];

  switch (event) {
    case "push": {
      const success = await pushHandler(req.body);
      if (!success) {
        return res.status(500).send("Error while creating deployment");
      }
      return res.send("Deployed");
    }

    case "deployment": {
      if (req.body.action !== "created") {
        return res.send("Not a create event");
      }

      const deploymentStarted = await createdDeploymentHandler(req.body);
      if (deploymentStarted) {
        return res.send("Deployed to cluster");
      } else {
        return res.status(500).send("No deployment started on cluster");
      }
    }

    case "installation": {
      await installationHandler(req.body);
      return res.send("Installation updated");
    }

    default: {
      console.log("Unhandled event:", event);
      return res.send("OK");
    }
  }
};
