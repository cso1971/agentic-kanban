import { useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { $api } from "#api/client.ts";
import { CoordinatorTab } from "./enqueue/coordinator-tab.tsx";
import { FreeTextTab } from "./enqueue/free-text-tab.tsx";
import { RalphTab } from "./enqueue/ralph-tab.tsx";
import type { TreeNode } from "./enqueue/shared.ts";
import { TriggerFileTab } from "./enqueue/trigger-file-tab.tsx";

type PromptMode = "file" | "text" | "coordinator" | "ralph";

const TABS: { mode: PromptMode; label: string }[] = [
	{ mode: "file", label: "From Trigger File" },
	{ mode: "text", label: "Free Text Prompt" },
	{ mode: "coordinator", label: "Coordinator" },
	{ mode: "ralph", label: "Ralph" },
];

export function EnqueuePage() {
	const navigate = useNavigate();
	const [mode, setMode] = useState<PromptMode>("file");
	const [result, setResult] = useState<{
		status: string;
		jobId: string;
		agentSessionId: string;
	} | null>(null);

	const { data: treeData, isLoading: treeLoading } = $api.useQuery(
		"get",
		"/api/config/tree",
	);

	const enqueueMutation = $api.useMutation("post", "/api/enqueue");

	const handleSubmit = useCallback(
		async (body: Record<string, unknown>) => {
			const res = await enqueueMutation.mutateAsync({ body: body as never });
			setResult(
				res as { status: string; jobId: string; agentSessionId: string },
			);
		},
		[enqueueMutation],
	);

	const tree = treeData?.tree as TreeNode[] | undefined;

	return (
		<div className="mx-auto max-w-3xl p-6">
			<h1 className="mb-6 font-semibold text-2xl text-gray-900">
				Enqueue Agent Run
			</h1>

			<div className="space-y-6">
				{/* Mode Toggle */}
				<div className="flex gap-1 rounded-lg bg-gray-100 p-1">
					{TABS.map((tab) => (
						<button
							className={`flex-1 rounded-md px-4 py-2 font-medium text-sm transition-colors ${
								mode === tab.mode
									? "bg-white text-gray-900 shadow-sm"
									: "text-gray-500 hover:text-gray-700"
							}`}
							key={tab.mode}
							onClick={() => {
								setMode(tab.mode);
								setResult(null);
							}}
							type="button"
						>
							{tab.label}
						</button>
					))}
				</div>

				{mode === "file" && (
					<TriggerFileTab
						isPending={enqueueMutation.isPending}
						onSubmit={handleSubmit}
						tree={tree}
						treeLoading={treeLoading}
					/>
				)}
				{mode === "text" && (
					<FreeTextTab
						isPending={enqueueMutation.isPending}
						onSubmit={handleSubmit}
					/>
				)}
				{mode === "coordinator" && (
					<CoordinatorTab
						isPending={enqueueMutation.isPending}
						onSubmit={handleSubmit}
						tree={tree}
						treeLoading={treeLoading}
					/>
				)}
				{mode === "ralph" && (
					<RalphTab
						isPending={enqueueMutation.isPending}
						onSubmit={handleSubmit}
						tree={tree}
						treeLoading={treeLoading}
					/>
				)}

				{enqueueMutation.isError && (
					<p className="text-red-600 text-sm">
						Failed to enqueue. Please check the server logs.
					</p>
				)}

				{/* Result */}
				{result && (
					<section className="rounded-lg border border-green-200 bg-green-50 p-6">
						<h2 className="mb-3 font-medium text-green-900 text-lg">
							Agent Run Enqueued
						</h2>
						<div className="space-y-2 text-sm">
							<p>
								<span className="font-medium text-green-800">Job ID:</span>{" "}
								<span className="font-mono text-green-700">{result.jobId}</span>
							</p>
							<p>
								<span className="font-medium text-green-800">Session ID:</span>{" "}
								<span className="font-mono text-green-700">
									{result.agentSessionId}
								</span>
							</p>
						</div>
						<button
							className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
							onClick={() =>
								navigate({
									to: "/agent-sessions/$sessionId",
									params: { sessionId: result.agentSessionId },
								})
							}
							type="button"
						>
							View Session
						</button>
					</section>
				)}
			</div>
		</div>
	);
}
