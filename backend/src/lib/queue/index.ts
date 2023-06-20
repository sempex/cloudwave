import { Queue, Worker } from "bullmq";
import { DeploymentCreatedEvent } from "@octokit/webhooks-types";

export const BUILD_QUEUE_NAME = "builds";

export const connection = {
  host: "localhost",
  port: 6379,
};

export const queue = new Queue(BUILD_QUEUE_NAME, {
  connection,
});

export const addBuildJob = (deploymentEvent: DeploymentCreatedEvent) => {
  queue.add(String(deploymentEvent.deployment.id), deploymentEvent);
};
