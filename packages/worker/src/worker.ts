import { agent, logger } from "@agentic-kanban/core";
import type { AgentJobData, JobData, JobResult } from "@agentic-kanban/queue";
import { AGENT_QUEUE_NAME, getRedisUrl } from "@agentic-kanban/queue";
import { Worker } from "bullmq";

const log = logger.queue;

const concurrency = parseInt(process.env.WORKER_CONCURRENCY ?? "1", 10);

function isAgentJob(data: JobData): data is AgentJobData {
	return data.type === "agent";
}

const worker = new Worker<JobData, JobResult>(
	AGENT_QUEUE_NAME,
	async (job) => {
		if (!isAgentJob(job.data)) {
			throw Error(`unrecognized job type ${job.id}`);
		}

		const { type, agentSessionId, jobId, ...options } = job.data;

		// Default: agent job
		log.info`Processing job ${job.id} (agentSession: ${job.data.agentSessionId})`;

		const result = await agent.run({
			prompt: options.prompt,
			model: options.model,
			cwd: options.cwd,
			permissionMode: "bypassPermissions",
			agentSessionId,
			jobId: job.id,
		});

		log.info`Job ${job.id} completed: ${result.result.slice(0, 200)}`;

		return {
			agentSessionId: result.agentSessionId,
			result: result.result,
		};
	},
	{
		connection: {
			url: getRedisUrl(),
			maxRetriesPerRequest: null,
		},
		concurrency,
		lockDuration: 30 * 60 * 1000, // 30 minutes for long-running agents
		lockRenewTime: 60 * 1000, // Renew lock every minute
	},
);

worker.on("completed", (job, result) => {
	const preview = "result" in result ? result.result.slice(0, 100) : "";
	log.info`Job ${job.id} completed with result: ${preview}`;
});

worker.on("failed", (job, err) => {
	log.error`Job ${job?.id} failed: ${err}`;
});

worker.on("error", (err) => {
	log.error`Worker error: ${err}`;
});

log.info`Worker started with concurrency=${concurrency}`;

async function shutdown() {
	log.info`Shutting down worker...`;
	await worker.close();
	process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
