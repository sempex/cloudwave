import { Job, Worker } from "bullmq";
import { BUILD_QUEUE_NAME, connection } from "./index.js";
import buildJob from "./jobs/buildJob.js";

const workerHandler = async (job: Job) => {
  await buildJob(job.data);
};

export function initWorker(): void {
  try {
    const worker = new Worker(BUILD_QUEUE_NAME, workerHandler, {
      connection: connection,
      autorun: true,
    });

    worker.on("completed", (job: Job) => {
      console.debug(`Completed: ${job.id}`);
    });

    worker.on("active", (job: Job<unknown>) => {
      console.debug(`Active: ${job.id}`);
    });
    worker.on("error", (failedReason: Error) => {
      console.error(`Build Error:`, failedReason);
    });
    console.log("🛠️  Worker initialized successfully");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}
