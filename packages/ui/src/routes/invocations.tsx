import { useState } from "react";
import { $api, type Invocation } from "../api/client";

export function InvocationsPage() {
	const [selectedId, setSelectedId] = useState<string | null>(null);

	const { data: invocations, isLoading } = $api.useQuery(
		"get",
		"/api/invocations",
		undefined,
		{ refetchInterval: 5000 },
	);

	const selected = invocations?.find((i) => i.id === selectedId);

	return (
		<div className="flex h-[calc(100vh-65px)]">
			<div className="w-96 border-r border-gray-200 overflow-auto p-4 bg-white">
				<h2 className="text-lg font-semibold text-gray-900 mb-4">
					Invocations
				</h2>
				{isLoading && <p className="text-gray-500">Loading...</p>}
				{invocations?.map((inv) => (
					<div
						key={inv.id}
						onClick={() => setSelectedId(inv.id)}
						className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
							selectedId === inv.id
								? "bg-blue-50 border border-blue-400"
								: "bg-gray-50 border border-transparent hover:bg-gray-100"
						}`}
					>
						<div className="flex justify-between items-center mb-1">
							<StatusBadge status={inv.status} />
							<span className="text-xs text-gray-500">
								{new Date(inv.startedAt).toLocaleString()}
							</span>
						</div>
						<p className="text-sm text-gray-700 truncate">{inv.prompt}</p>
						<p className="text-xs text-gray-400 mt-1 font-mono">
							{inv.id.slice(0, 8)}
						</p>
					</div>
				))}
				{!isLoading && invocations?.length === 0 && (
					<p className="text-gray-500">No invocations yet.</p>
				)}
			</div>

			<div className="flex-1 overflow-auto p-6">
				{selected ? (
					<InvocationDetail invocation={selected} />
				) : (
					<p className="text-gray-500">Select an invocation to view details.</p>
				)}
			</div>
		</div>
	);
}

function StatusBadge({ status }: { status: string }) {
	const classes: Record<string, string> = {
		running: "bg-yellow-100 text-yellow-700",
		completed: "bg-green-100 text-green-700",
		failed: "bg-red-100 text-red-700",
	};

	return (
		<span
			className={`text-xs px-2 py-0.5 rounded font-medium ${classes[status] ?? "bg-gray-100 text-gray-600"}`}
		>
			{status}
		</span>
	);
}

function InvocationDetail({ invocation }: { invocation: Invocation }) {
	const { data: messages } = $api.useQuery(
		"get",
		"/api/invocations/{id}/messages",
		{ params: { path: { id: invocation.id } } },
		{
			refetchInterval: invocation.status === "running" ? 2000 : false,
		},
	);

	return (
		<div>
			<h2 className="text-xl font-semibold text-gray-900 mb-4">
				Invocation {invocation.id.slice(0, 8)}
			</h2>

			<div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm mb-6">
				<span className="text-gray-500">Status</span>
				<StatusBadge status={invocation.status} />

				<span className="text-gray-500">Started</span>
				<span>{new Date(invocation.startedAt).toLocaleString()}</span>

				{invocation.completedAt && (
					<>
						<span className="text-gray-500">Completed</span>
						<span>{new Date(invocation.completedAt).toLocaleString()}</span>
					</>
				)}

				{invocation.durationMs != null && (
					<>
						<span className="text-gray-500">Duration</span>
						<span>{(invocation.durationMs / 1000).toFixed(1)}s</span>
					</>
				)}

				{invocation.totalCostUsd != null && (
					<>
						<span className="text-gray-500">Cost</span>
						<span>${invocation.totalCostUsd.toFixed(4)}</span>
					</>
				)}

				{invocation.numTurns != null && (
					<>
						<span className="text-gray-500">Turns</span>
						<span>{invocation.numTurns}</span>
					</>
				)}

				<span className="text-gray-500">CWD</span>
				<span className="font-mono text-xs">{invocation.cwd}</span>
			</div>

			<h3 className="font-medium text-gray-900 mb-2">Prompt</h3>
			<pre className="bg-gray-100 p-3 rounded-lg text-sm whitespace-pre-wrap mb-4">
				{invocation.prompt}
			</pre>

			{invocation.result && (
				<>
					<h3 className="font-medium text-gray-900 mb-2">Result</h3>
					<pre className="bg-green-50 p-3 rounded-lg text-sm whitespace-pre-wrap mb-4">
						{invocation.result}
					</pre>
				</>
			)}

			{invocation.error && (
				<>
					<h3 className="font-medium text-red-700 mb-2">Error</h3>
					<pre className="bg-red-50 p-3 rounded-lg text-sm whitespace-pre-wrap mb-4">
						{invocation.error}
					</pre>
				</>
			)}

			<h3 className="font-medium text-gray-900 mb-2">
				Messages ({messages?.length ?? 0})
			</h3>
			<div className="space-y-2">
				{messages?.map((msg, i) => (
					<div
						key={i}
						className="p-3 bg-gray-50 rounded-lg border-l-3"
						style={{ borderLeftColor: messageColor(msg.type) }}
					>
						<div className="flex justify-between items-center mb-1">
							<span
								className="text-xs font-medium"
								style={{ color: messageColor(msg.type) }}
							>
								{msg.type}
							</span>
							<span className="text-xs text-gray-400">
								{new Date(msg.timestamp).toLocaleTimeString()}
							</span>
						</div>
						{msg.text && (
							<pre className="text-sm text-gray-700 whitespace-pre-wrap m-0">
								{msg.text}
							</pre>
						)}
					</div>
				))}
				{messages?.length === 0 && (
					<p className="text-gray-500 text-sm">No messages yet.</p>
				)}
			</div>
		</div>
	);
}

function messageColor(type: string): string {
	switch (type) {
		case "assistant":
			return "#3b82f6";
		case "result":
			return "#14b8a6";
		case "system":
			return "#6b7280";
		default:
			return "#9ca3af";
	}
}
