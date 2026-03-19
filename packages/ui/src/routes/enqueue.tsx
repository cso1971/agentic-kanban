import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { $api } from "#api/client.ts";

interface TreeNode {
	name: string;
	path: string;
	type: "file" | "directory";
	children?: TreeNode[];
}

function collectMdFiles(nodes: TreeNode[], prefix = ""): string[] {
	const files: string[] = [];
	for (const node of nodes) {
		if (node.type === "directory" && node.children) {
			files.push(...collectMdFiles(node.children, `${prefix}${node.name}/`));
		} else if (node.type === "file" && node.name.endsWith(".md")) {
			files.push(node.path);
		}
	}
	return files;
}

function filterTriggerFiles(nodes: TreeNode[]): string[] {
	for (const node of nodes) {
		if (
			node.type === "directory" &&
			node.name === "triggers" &&
			node.children
		) {
			return collectMdFiles(node.children).map((p) => p);
		}
	}
	// Fallback: return all .md files if no triggers directory
	return collectMdFiles(nodes);
}

/** Extract folder names from a specific top-level directory in the tree */
function extractFolderEntries(
	nodes: TreeNode[],
	dirName: string,
): { name: string; promptPath: string }[] {
	for (const node of nodes) {
		if (node.type === "directory" && node.name === dirName && node.children) {
			return node.children
				.filter((child) => child.type === "directory")
				.map((child) => ({
					name: child.name,
					promptPath: `${child.path}/agent.md`,
				}));
		}
	}
	return [];
}

const TEMPLATE_VARS = [
	{ key: "projectId", label: "Project ID", placeholder: "e.g. 1" },
	{ key: "issueId", label: "Issue IID", placeholder: "e.g. 42" },
	{
		key: "issueTitle",
		label: "Issue Title",
		placeholder: "e.g. Add login page",
	},
	{
		key: "issueDescription",
		label: "Issue Description",
		placeholder: "Describe the issue...",
	},
	{ key: "mrIid", label: "MR IID", placeholder: "e.g. 10" },
	{ key: "mrTitle", label: "MR Title", placeholder: "e.g. feat: add auth" },
	{
		key: "sourceBranch",
		label: "Source Branch",
		placeholder: "e.g. feature/auth",
	},
	{ key: "reviewerName", label: "Reviewer Name", placeholder: "e.g. John" },
	{ key: "discussionId", label: "Discussion ID", placeholder: "" },
	{
		key: "reviewComment",
		label: "Review Comment",
		placeholder: "e.g. Please fix...",
	},
] as const;

type PromptMode = "file" | "text" | "coordinator";

export function EnqueuePage() {
	const navigate = useNavigate();
	const [mode, setMode] = useState<PromptMode>("file");
	const [selectedPrompt, setSelectedPrompt] = useState("");
	const [promptText, setPromptText] = useState("");
	const [vars, setVars] = useState<Record<string, string>>({});
	const [result, setResult] = useState<{
		status: string;
		jobId: string;
		agentSessionId: string;
	} | null>(null);

	// Coordinator mode state
	const [selectedCoordinator, setSelectedCoordinator] = useState("");
	const [selectedTeammates, setSelectedTeammates] = useState<string[]>([]);
	const [topic, setTopic] = useState("");

	const { data: treeData, isLoading: treeLoading } = $api.useQuery(
		"get",
		"/api/config/tree",
	);

	const { data: promptContent } = $api.useQuery(
		"get",
		"/api/config/file",
		{ params: { query: { path: selectedPrompt } } },
		{ enabled: !!selectedPrompt },
	);

	const enqueueMutation = $api.useMutation("post", "/api/enqueue");

	const triggerFiles = useMemo(() => {
		if (!treeData?.tree) return [];
		return filterTriggerFiles(treeData.tree as TreeNode[]);
	}, [treeData]);

	const coordinators = useMemo(() => {
		if (!treeData?.tree) return [];
		return extractFolderEntries(treeData.tree as TreeNode[], "coordinators");
	}, [treeData]);

	const agents = useMemo(() => {
		if (!treeData?.tree) return [];
		return extractFolderEntries(treeData.tree as TreeNode[], "agents");
	}, [treeData]);

	// Detect which template variables are used in the selected prompt
	const usedVars = useMemo(() => {
		const content = promptContent?.content ?? "";
		return TEMPLATE_VARS.filter((v) => {
			const templateKey =
				v.key === "projectId"
					? "PROJECT_ID"
					: v.key === "issueId"
						? "ISSUE_IID"
						: v.key === "issueTitle"
							? "ISSUE_TITLE"
							: v.key === "issueDescription"
								? "ISSUE_DESCRIPTION"
								: v.key === "mrIid"
									? "MR_IID"
									: v.key === "mrTitle"
										? "MR_TITLE"
										: v.key === "sourceBranch"
											? "SOURCE_BRANCH"
											: v.key === "reviewerName"
												? "REVIEWER_NAME"
												: v.key === "discussionId"
													? "DISCUSSION_ID"
													: v.key === "reviewComment"
														? "REVIEW_COMMENT"
														: "";
			return content.includes(`{{${templateKey}}}`);
		});
	}, [promptContent?.content]);

	const handleVarChange = useCallback((key: string, value: string) => {
		setVars((prev) => ({ ...prev, [key]: value }));
	}, []);

	const toggleTeammate = useCallback((agentName: string) => {
		setSelectedTeammates((prev) =>
			prev.includes(agentName)
				? prev.filter((n) => n !== agentName)
				: [...prev, agentName],
		);
	}, []);

	const buildTeammatesTable = useCallback(() => {
		if (selectedTeammates.length === 0) return "";
		const header = "| Role | Spawn Prompt |\n|------|-------------|";
		const rows = selectedTeammates.map(
			(name) => `| ${name} | agents/${name}/agent.md |`,
		);
		return `${header}\n${rows.join("\n")}`;
	}, [selectedTeammates]);

	const canSubmit =
		mode === "text"
			? promptText.trim().length > 0
			: mode === "coordinator"
				? !!selectedCoordinator &&
					selectedTeammates.length > 0 &&
					topic.trim().length > 0
				: !!selectedPrompt;

	const handleSubmit = useCallback(async () => {
		if (!canSubmit) return;

		const body =
			mode === "text"
				? { promptText: promptText.trim(), projectId: "" }
				: mode === "coordinator"
					? {
							promptPath: selectedCoordinator,
							projectId: "",
							issueTitle: topic.trim(),
							teammatesTable: buildTeammatesTable(),
						}
					: {
							promptPath: selectedPrompt,
							projectId: vars.projectId ?? "",
							issueId: vars.issueId || undefined,
							issueTitle: vars.issueTitle || undefined,
							issueDescription: vars.issueDescription || undefined,
							mrIid: vars.mrIid || undefined,
							mrTitle: vars.mrTitle || undefined,
							sourceBranch: vars.sourceBranch || undefined,
							reviewerName: vars.reviewerName || undefined,
							discussionId: vars.discussionId || undefined,
							reviewComment: vars.reviewComment || undefined,
						};

		const res = await enqueueMutation.mutateAsync({ body });

		setResult(res as { status: string; jobId: string; agentSessionId: string });
	}, [
		canSubmit,
		mode,
		promptText,
		selectedPrompt,
		selectedCoordinator,
		topic,
		buildTeammatesTable,
		vars,
		enqueueMutation,
	]);

	return (
		<div className="mx-auto max-w-3xl p-6">
			<h1 className="mb-6 font-semibold text-2xl text-gray-900">
				Enqueue Agent Run
			</h1>

			<div className="space-y-6">
				{/* Mode Toggle */}
				<div className="flex gap-1 rounded-lg bg-gray-100 p-1">
					<button
						className={`flex-1 rounded-md px-4 py-2 font-medium text-sm transition-colors ${
							mode === "file"
								? "bg-white text-gray-900 shadow-sm"
								: "text-gray-500 hover:text-gray-700"
						}`}
						onClick={() => {
							setMode("file");
							setResult(null);
						}}
						type="button"
					>
						From Trigger File
					</button>
					<button
						className={`flex-1 rounded-md px-4 py-2 font-medium text-sm transition-colors ${
							mode === "text"
								? "bg-white text-gray-900 shadow-sm"
								: "text-gray-500 hover:text-gray-700"
						}`}
						onClick={() => {
							setMode("text");
							setResult(null);
						}}
						type="button"
					>
						Free Text Prompt
					</button>
					<button
						className={`flex-1 rounded-md px-4 py-2 font-medium text-sm transition-colors ${
							mode === "coordinator"
								? "bg-white text-gray-900 shadow-sm"
								: "text-gray-500 hover:text-gray-700"
						}`}
						onClick={() => {
							setMode("coordinator");
							setResult(null);
						}}
						type="button"
					>
						Coordinator
					</button>
				</div>

				{mode === "text" ? (
					/* Free Text Prompt */
					<section className="rounded-lg border border-gray-200 bg-white p-6">
						<h2 className="mb-3 font-medium text-gray-900 text-lg">Prompt</h2>
						<p className="mb-3 text-gray-500 text-sm">
							Write a prompt to send directly to the agent.
						</p>
						<textarea
							className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							onChange={(e) => setPromptText(e.target.value)}
							placeholder="Enter your prompt here..."
							rows={8}
							value={promptText}
						/>
					</section>
				) : mode === "coordinator" ? (
					/* Coordinator Mode */
					<>
						{/* Coordinator Picker */}
						<section className="rounded-lg border border-gray-200 bg-white p-6">
							<h2 className="mb-3 font-medium text-gray-900 text-lg">
								Coordinator
							</h2>
							<p className="mb-3 text-gray-500 text-sm">
								Select a coordinator to moderate the discussion.
							</p>

							{treeLoading ? (
								<p className="text-gray-500 text-sm">Loading...</p>
							) : coordinators.length === 0 ? (
								<p className="text-gray-500 text-sm">
									No coordinators found in the config directory.
								</p>
							) : (
								<div className="space-y-2">
									{coordinators.map((c) => (
										<label
											className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
												selectedCoordinator === c.promptPath
													? "border-blue-500 bg-blue-50"
													: "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
											}`}
											key={c.name}
										>
											<input
												checked={selectedCoordinator === c.promptPath}
												className="text-blue-600"
												name="coordinator"
												onChange={() => {
													setSelectedCoordinator(c.promptPath);
													setResult(null);
												}}
												type="radio"
											/>
											<span className="font-medium text-gray-900 text-sm">
												{c.name}
											</span>
										</label>
									))}
								</div>
							)}
						</section>

						{/* Teammates Multi-select */}
						<section className="rounded-lg border border-gray-200 bg-white p-6">
							<h2 className="mb-3 font-medium text-gray-900 text-lg">
								Teammates
							</h2>
							<p className="mb-3 text-gray-500 text-sm">
								Select agents to participate in the discussion.
							</p>

							{treeLoading ? (
								<p className="text-gray-500 text-sm">Loading...</p>
							) : agents.length === 0 ? (
								<p className="text-gray-500 text-sm">
									No agents found in the config directory.
								</p>
							) : (
								<div className="space-y-2">
									{agents.map((a) => (
										<label
											className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
												selectedTeammates.includes(a.name)
													? "border-blue-500 bg-blue-50"
													: "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
											}`}
											key={a.name}
										>
											<input
												checked={selectedTeammates.includes(a.name)}
												className="text-blue-600"
												onChange={() => toggleTeammate(a.name)}
												type="checkbox"
											/>
											<span className="font-medium text-gray-900 text-sm">
												{a.name}
											</span>
										</label>
									))}
								</div>
							)}

							{selectedTeammates.length > 0 && (
								<p className="mt-3 text-gray-500 text-sm">
									{selectedTeammates.length} teammate
									{selectedTeammates.length !== 1 ? "s" : ""} selected
								</p>
							)}
						</section>

						{/* Topic Input */}
						<section className="rounded-lg border border-gray-200 bg-white p-6">
							<h2 className="mb-3 font-medium text-gray-900 text-lg">Topic</h2>
							<p className="mb-3 text-gray-500 text-sm">
								The topic for the agents to discuss.
							</p>
							<textarea
								className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								onChange={(e) => setTopic(e.target.value)}
								placeholder="e.g. Should we migrate from monolith to microservices?"
								rows={3}
								value={topic}
							/>
						</section>
					</>
				) : (
					<>
						{/* Prompt File Picker */}
						<section className="rounded-lg border border-gray-200 bg-white p-6">
							<h2 className="mb-3 font-medium text-gray-900 text-lg">
								Prompt File
							</h2>
							<p className="mb-3 text-gray-500 text-sm">
								Select a trigger prompt (.md) from the config directory.
							</p>

							{treeLoading ? (
								<p className="text-gray-500 text-sm">Loading config files...</p>
							) : triggerFiles.length === 0 ? (
								<p className="text-gray-500 text-sm">
									No .md trigger files found in the config directory.
								</p>
							) : (
								<div className="space-y-2">
									{triggerFiles.map((file) => (
										<label
											className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
												selectedPrompt === file
													? "border-blue-500 bg-blue-50"
													: "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
											}`}
											key={file}
										>
											<input
												checked={selectedPrompt === file}
												className="text-blue-600"
												name="prompt"
												onChange={() => {
													setSelectedPrompt(file);
													setResult(null);
												}}
												type="radio"
											/>
											<div>
												<span className="font-medium text-gray-900 text-sm">
													{file.split("/").pop()}
												</span>
												<span className="ml-2 text-gray-400 text-xs">
													{file}
												</span>
											</div>
										</label>
									))}
								</div>
							)}
						</section>

						{/* Prompt Preview */}
						{selectedPrompt && promptContent?.content && (
							<section className="rounded-lg border border-gray-200 bg-white p-6">
								<h2 className="mb-3 font-medium text-gray-900 text-lg">
									Prompt Preview
								</h2>
								<pre className="max-h-48 overflow-auto rounded-lg bg-gray-50 p-4 font-mono text-gray-700 text-sm">
									{promptContent.content}
								</pre>
							</section>
						)}

						{/* Template Variables */}
						{selectedPrompt && usedVars.length > 0 && (
							<section className="rounded-lg border border-gray-200 bg-white p-6">
								<h2 className="mb-3 font-medium text-gray-900 text-lg">
									Template Variables
								</h2>
								<p className="mb-4 text-gray-500 text-sm">
									Fill in the variables used in this prompt template.
								</p>
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									{usedVars.map((v) => (
										<div key={v.key}>
											<label
												className="mb-1 block font-medium text-gray-700 text-sm"
												htmlFor={v.key}
											>
												{v.label}
											</label>
											{v.key === "issueDescription" ||
											v.key === "reviewComment" ? (
												<textarea
													className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
													id={v.key}
													onChange={(e) =>
														handleVarChange(v.key, e.target.value)
													}
													placeholder={v.placeholder}
													rows={3}
													value={vars[v.key] ?? ""}
												/>
											) : (
												<input
													className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
													id={v.key}
													onChange={(e) =>
														handleVarChange(v.key, e.target.value)
													}
													placeholder={v.placeholder}
													type="text"
													value={vars[v.key] ?? ""}
												/>
											)}
										</div>
									))}
								</div>
							</section>
						)}
					</>
				)}

				{/* Submit */}
				<div className="flex items-center gap-4">
					<button
						className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
						disabled={!canSubmit || enqueueMutation.isPending}
						onClick={handleSubmit}
						type="button"
					>
						{enqueueMutation.isPending ? "Enqueuing..." : "Enqueue Agent Run"}
					</button>

					{enqueueMutation.isError && (
						<p className="text-red-600 text-sm">
							Failed to enqueue. Please check the server logs.
						</p>
					)}
				</div>

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
