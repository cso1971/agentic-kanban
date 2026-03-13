import { Queue } from "bullmq";
import { getRedisUrl } from "./connection";
import type { JobData, JobResult } from "./types";

export const AGENT_QUEUE_NAME = "agent-jobs";

let agentQueue: Queue<JobData, JobResult> | null = null;

export function getAgentQueue(): Queue<JobData, JobResult> {
	if (!agentQueue) {
		agentQueue = new Queue<JobData, JobResult>(AGENT_QUEUE_NAME, {
			connection: {
				url: getRedisUrl(),
				maxRetriesPerRequest: null,
			},
			defaultJobOptions: {
				attempts: 3,
				backoff: {
					type: "exponential",
					delay: 1000,
				},
				removeOnComplete: {
					age: 24 * 60 * 60, // 24 hours
					count: 1000,
				},
				removeOnFail: {
					age: 7 * 24 * 60 * 60, // 7 days
				},
			},
		});
	}

	return agentQueue;
}

export async function closeQueue(): Promise<void> {
	if (agentQueue) {
		await agentQueue.close();
		agentQueue = null;
	}
}
