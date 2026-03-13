import { configure, getConsoleSink, getLogger } from "@logtape/logtape";

let configured = false;

export async function setupLogger() {
	if (configured) return;
	configured = true;

	await configure({
		sinks: {
			console: getConsoleSink(),
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

export function createLogger(category: string[]) {
	return getLogger(["agents", ...category]);
}

// Pre-configured loggers for each package
export const logger = {
	core: createLogger(["core"]),
	server: createLogger(["server"]),
	cli: createLogger(["cli"]),
};
