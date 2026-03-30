import { add, divide, multiply, subtract } from "./calculator.ts";

const operations = { add, subtract, multiply, divide } as const;

const server = Bun.serve({
	port: 3001,
	async fetch(req) {
		const url = new URL(req.url);

		if (req.method === "OPTIONS") {
			return new Response(null, {
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
				},
			});
		}

		const cors = { "Access-Control-Allow-Origin": "*" };

		if (req.method !== "POST") {
			return Response.json(
				{ error: "Method not allowed" },
				{ status: 405, headers: cors },
			);
		}

		const operation = url.pathname.slice(1) as keyof typeof operations;
		const fn = operations[operation];

		if (!fn) {
			return Response.json(
				{ error: `Unknown operation: ${operation}` },
				{ status: 404, headers: cors },
			);
		}

		const body = (await req.json()) as { a: number; b: number };

		if (typeof body.a !== "number" || typeof body.b !== "number") {
			return Response.json(
				{ error: "Invalid input: a and b must be numbers" },
				{ status: 400, headers: cors },
			);
		}

		try {
			const result = fn(body.a, body.b);
			return Response.json({ result }, { headers: cors });
		} catch (e) {
			return Response.json(
				{ error: (e as Error).message },
				{ status: 400, headers: cors },
			);
		}
	},
});

console.log(`Calculator backend listening on http://localhost:${server.port}`);
