import {
	configure,
	getAnsiColorFormatter,
	getConsoleSink,
	getLogger,
} from "@logtape/logtape";

let configured = false;

async function setupLogger() {
	if (configured) {
		return;
	}

	configured = true;

	await configure({
		sinks: {
			console: getConsoleSink({ formatter: getAnsiColorFormatter() }),
		},
		loggers: [
			{
				category: ["logtape", "meta"],
				lowestLevel: "warning",
				sinks: ["console"],
			},
			{
				category: ["agents"],
				lowestLevel: "debug",
				sinks: ["console"],
			},
		],
	});
}

function createLogger(category: string[]) {
	setupLogger();

	if (!configured) {
		throw new Error("logger not configured!");
	}

	return getLogger(["agents", ...category]);
}

await setupLogger();

// Pre-configured loggers for each package
export const logger = {
	core: createLogger(["core"]),
	server: createLogger(["server"]),
	cli: createLogger(["cli"]),
	queue: createLogger(["queue"]),
	gitlab: createLogger(["gitlab"]),
};
