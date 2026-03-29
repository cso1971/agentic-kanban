import { useNavigate, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { $api, type AgentSession } from "#api/client.ts";
import type { components } from "#api/schema";

type ParsedMessage = components["schemas"]["ParsedMessage"];
type AgentSessionMessage = components["schemas"]["AgentSessionMessage"];

interface ToolNode {
	toolUse: AgentSessionMessage;
	toolResult?: AgentSessionMessage;
}

interface TaskNode {
	taskId: string;
	progress: AgentSessionMessage[];
	notification?: AgentSessionMessage;
}

interface Turn {
	text?: AgentSessionMessage;
	tools: ToolNode[];
	tasks: TaskNode[];
	other: AgentSessionMessage[];
}

export function AgentSessionsPage() {
	const { sessionId } = useParams({ strict: false }) as { sessionId?: string };
	const navigate = useNavigate();
	const selectedId = sessionId ?? null;

	const { data: sessions, isLoading } = $api.useQuery(
		"get",
		"/api/agent-sessions",
		undefined,
		{ refetchInterval: 5000 },
	);

	const selected = sessions?.find((s) => s.id === selectedId);

	return (
		<div className="flex h-[calc(100vh-65px)]">
			<div className="w-96 overflow-auto border-gray-200 border-r bg-white p-4">
				<h2 className="mb-4 font-semibold text-gray-900 text-lg">
					Agent Sessions
				</h2>
				{isLoading && <p className="text-gray-500">Loading...</p>}
				{sessions?.map((session) => (
					<div
						className={`mb-2 cursor-pointer rounded-lg p-3 transition-colors ${
							selectedId === session.id
								? "border border-blue-400 bg-blue-50"
								: "border border-transparent bg-gray-50 hover:bg-gray-100"
						}`}
						key={session.id}
						onClick={() =>
							navigate({
								to: "/agent-sessions/$sessionId",
								params: { sessionId: session.id },
							})
						}
					>
						<div className="mb-1 flex items-center justify-between">
							<StatusBadge status={session.status} />
							<span className="text-gray-500 text-xs">
								{new Date(session.startedAt).toLocaleString()}
							</span>
						</div>
						<p className="truncate text-gray-700 text-sm">{session.prompt}</p>
						<p className="mt-1 font-mono text-gray-400 text-xs">
							{session.id.slice(0, 8)}
						</p>
					</div>
				))}
				{!isLoading && sessions?.length === 0 && (
					<p className="text-gray-500">No agent sessions yet.</p>
				)}
			</div>

			<div className="flex-1 overflow-auto p-6">
				{selected ? (
					<AgentSessionDetail session={selected} />
				) : (
					<p className="text-gray-500">
						Select an agent session to view details.
					</p>
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
			className={`rounded px-2 py-0.5 font-medium text-xs ${classes[status] ?? "bg-gray-100 text-gray-600"}`}
		>
			{status}
		</span>
	);
}

function AgentSessionDetail({ session }: { session: AgentSession }) {
	const { data: messages } = $api.useQuery(
		"get",
		"/api/agent-sessions/{id}/messages",
		{ params: { path: { id: session.id } } },
		{
			refetchInterval: session.status === "running" ? 2000 : false,
		},
	);

	return (
		<div>
			<h2 className="mb-4 font-semibold text-gray-900 text-xl">
				Agent Session {session.id.slice(0, 8)}
			</h2>

			<div className="mb-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
				<span className="text-gray-500">Status</span>
				<StatusBadge status={session.status} />

				<span className="text-gray-500">Started</span>
				<span>{new Date(session.startedAt).toLocaleString()}</span>

				{session.completedAt && (
					<>
						<span className="text-gray-500">Completed</span>
						<span>{new Date(session.completedAt).toLocaleString()}</span>
					</>
				)}

				{session.durationMs != null && (
					<>
						<span className="text-gray-500">Duration</span>
						<span>{(session.durationMs / 1000).toFixed(1)}s</span>
					</>
				)}

				{session.totalCostUsd != null && (
					<>
						<span className="text-gray-500">Cost</span>
						<span>${session.totalCostUsd.toFixed(4)}</span>
					</>
				)}

				{session.numTurns != null && (
					<>
						<span className="text-gray-500">Turns</span>
						<span>{session.numTurns}</span>
					</>
				)}

				<span className="text-gray-500">CWD</span>
				<span className="font-mono text-xs">{session.cwd}</span>
			</div>

			<details className="group mb-4">
				<summary className="mb-2 flex cursor-pointer list-none items-center gap-1 font-medium text-gray-900">
					<span className="text-gray-400 text-xs transition-transform group-open:rotate-90">
						&#9654;
					</span>
					Prompt
				</summary>
				<div className="prose prose-sm max-w-none rounded-lg bg-gray-100 p-3">
					<ReactMarkdown remarkPlugins={[remarkGfm]}>
						{session.prompt}
					</ReactMarkdown>
				</div>
			</details>

			{session.appendSystemPrompt && (
				<details className="group mb-4">
					<summary className="mb-2 flex cursor-pointer list-none items-center gap-1 font-medium text-gray-900">
						<span className="text-gray-400 text-xs transition-transform group-open:rotate-90">
							&#9654;
						</span>
						System Prompt
					</summary>
					<div className="prose prose-sm max-w-none rounded-lg bg-amber-50 p-3">
						<ReactMarkdown remarkPlugins={[remarkGfm]}>
							{session.appendSystemPrompt}
						</ReactMarkdown>
					</div>
				</details>
			)}

			{session.result && (
				<details className="group mb-4">
					<summary className="mb-2 flex cursor-pointer list-none items-center gap-1 font-medium text-gray-900">
						<span className="text-gray-400 text-xs transition-transform group-open:rotate-90">
							&#9654;
						</span>
						Result
					</summary>
					<pre className="whitespace-pre-wrap rounded-lg bg-green-50 p-3 text-sm">
						{session.result}
					</pre>
				</details>
			)}

			{session.error && (
				<>
					<h3 className="mb-2 font-medium text-red-700">Error</h3>
					<pre className="mb-4 whitespace-pre-wrap rounded-lg bg-red-50 p-3 text-sm">
						{session.error}
					</pre>
				</>
			)}

			<SkillsUsedSection messages={messages} />

			<TeammateMessagesSection
				isRunning={session.status === "running"}
				sessionId={session.id}
			/>

			<ArtifactsSection
				isRunning={session.status === "running"}
				sessionId={session.id}
			/>

			<MessagesSection messages={messages} />
		</div>
	);
}

function SkillsUsedSection({
	messages,
}: {
	messages: AgentSessionMessage[] | undefined;
}) {
	const skills = useMemo(() => {
		if (!messages) return null;

		const skillCounts = new Map<string, number>();

		for (const msg of messages) {
			const parsed = msg.message;
			if (!parsed) continue;
			if (parsed.type === "tool_use" && parsed.toolName === "Skill") {
				const skillName =
					(parsed.input as { skill?: string }).skill ?? "unknown";
				skillCounts.set(skillName, (skillCounts.get(skillName) ?? 0) + 1);
			}
		}

		if (skillCounts.size === 0) return null;

		return [...skillCounts.entries()].sort((a, b) => b[1] - a[1]);
	}, [messages]);

	if (!skills) return null;

	return (
		<details className="group mb-4" open>
			<summary className="mb-2 flex cursor-pointer list-none items-center gap-1 font-medium text-gray-900">
				<span className="text-gray-400 text-xs transition-transform group-open:rotate-90">
					&#9654;
				</span>
				Skills ({skills.length})
			</summary>
			<div className="rounded-lg border border-gray-200 bg-white p-4">
				<div className="flex flex-wrap gap-2">
					{skills.map(([name, count]) => (
						<span
							className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 font-mono text-indigo-700 text-xs"
							key={name}
						>
							/{name}
							{count > 1 && (
								<span className="rounded-full bg-indigo-200 px-1.5 py-0.5 font-medium text-indigo-800 text-xs leading-none">
									{count}
								</span>
							)}
						</span>
					))}
				</div>
			</div>
		</details>
	);
}

function TeammateMessagesSection({
	sessionId,
	isRunning,
}: {
	sessionId: string;
	isRunning: boolean;
}) {
	const { data: teammateMessages } = $api.useQuery(
		"get",
		"/api/agent-sessions/{id}/teammate-messages",
		{ params: { path: { id: sessionId } } },
		{
			refetchInterval: isRunning ? 3000 : false,
		},
	);

	if (!teammateMessages || teammateMessages.length === 0) {
		return null;
	}

	// Group messages by agentName
	const grouped = new Map<string, typeof teammateMessages>();
	for (const msg of teammateMessages) {
		const existing = grouped.get(msg.agentName) ?? [];
		existing.push(msg);
		grouped.set(msg.agentName, existing);
	}

	return (
		<details className="group mb-4">
			<summary className="mb-2 flex cursor-pointer list-none items-center gap-1 font-medium text-gray-900">
				<span className="text-gray-400 text-xs transition-transform group-open:rotate-90">
					&#9654;
				</span>
				Teammate Activity ({teammateMessages.length})
			</summary>
			<div className="space-y-3">
				{[...grouped.entries()].map(([agentName, messages]) => (
					<div
						className="rounded-lg border border-gray-200 bg-white"
						key={agentName}
					>
						<div className="flex items-center gap-2 border-gray-100 border-b px-4 py-2">
							<span
								className="inline-block h-2 w-2 rounded-full"
								style={{
									backgroundColor: agentColor(agentName),
								}}
							/>
							<span className="font-medium text-gray-900 text-sm">
								{agentName}
							</span>
							<span className="text-gray-400 text-xs">
								{messages.length} message{messages.length !== 1 ? "s" : ""}
							</span>
						</div>
						<div className="divide-y divide-gray-50 px-4">
							{messages.map((msg, i) => (
								<div className="py-2" key={i}>
									<ReactMarkdown remarkPlugins={[remarkGfm]}>
										{msg.content}
									</ReactMarkdown>
									<span className="text-gray-400 text-xs">
										{new Date(msg.timestamp).toLocaleTimeString()}
									</span>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</details>
	);
}

const AGENT_COLORS = [
	"#8b5cf6",
	"#3b82f6",
	"#10b981",
	"#f59e0b",
	"#ec4899",
	"#14b8a6",
	"#ef4444",
	"#6366f1",
];

function agentColor(name: string): string {
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = (hash << 5) - hash + name.charCodeAt(i);
		hash |= 0;
	}
	return AGENT_COLORS[Math.abs(hash) % AGENT_COLORS.length];
}

function ArtifactsSection({
	sessionId,
	isRunning,
}: {
	sessionId: string;
	isRunning: boolean;
}) {
	const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null);

	const { data: artifacts } = $api.useQuery(
		"get",
		"/api/agent-sessions/{id}/artifacts",
		{ params: { path: { id: sessionId } } },
		{
			refetchInterval: isRunning ? 5000 : false,
		},
	);

	const { data: artifactContent } = $api.useQuery(
		"get",
		"/api/agent-sessions/{id}/artifact",
		{
			params: {
				path: { id: sessionId },
				query: { path: selectedArtifact ?? "" },
			},
		},
		{
			enabled: selectedArtifact !== null,
		},
	);

	if (!artifacts || artifacts.length === 0) {
		return null;
	}

	return (
		<details className="group mb-4">
			<summary className="mb-2 flex cursor-pointer list-none items-center gap-1 font-medium text-gray-900">
				<span className="text-gray-400 text-xs transition-transform group-open:rotate-90">
					&#9654;
				</span>
				Artifacts ({artifacts.length})
			</summary>
			<div className="rounded-lg border border-gray-200 bg-white">
				<div className="flex flex-wrap gap-2 border-gray-100 border-b p-3">
					{artifacts.map((artifact) => (
						<button
							className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
								selectedArtifact === artifact.name
									? "border border-blue-200 bg-blue-50 text-blue-700"
									: "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
							}`}
							key={artifact.name}
							onClick={() =>
								setSelectedArtifact(
									selectedArtifact === artifact.name ? null : artifact.name,
								)
							}
							type="button"
						>
							<span className="text-gray-400">&#128196;</span>
							<span className="font-medium">{artifact.name}</span>
							<span className="text-gray-400 text-xs">
								{formatFileSize(artifact.size)}
							</span>
						</button>
					))}
				</div>

				{selectedArtifact && artifactContent && (
					<div className="p-4">
						<div className="prose prose-sm max-w-none">
							{selectedArtifact.endsWith(".md") ? (
								<ReactMarkdown remarkPlugins={[remarkGfm]}>
									{artifactContent.content}
								</ReactMarkdown>
							) : (
								<pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm">
									{artifactContent.content}
								</pre>
							)}
						</div>
					</div>
				)}
			</div>
		</details>
	);
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildTurns(messages: AgentSessionMessage[]): Turn[] {
	const turns: Turn[] = [];
	let current: Turn = { tools: [], tasks: [], other: [] };

	const resultMap = new Map<string, AgentSessionMessage>();
	for (const msg of messages) {
		if (msg.message?.type === "tool_result") {
			resultMap.set(msg.message.toolUseId, msg);
		}
	}

	// Track task nodes by taskId within each turn
	let taskMap = new Map<string, TaskNode>();

	for (const msg of messages) {
		const parsed = msg.message;
		if (!parsed) {
			current.other.push(msg);
			continue;
		}

		switch (parsed.type) {
			case "assistant_text": {
				if (
					current.text ||
					current.tools.length > 0 ||
					current.tasks.length > 0 ||
					current.other.length > 0
				) {
					turns.push(current);
					current = { tools: [], tasks: [], other: [] };
					taskMap = new Map();
				}
				current.text = msg;
				break;
			}
			case "tool_use": {
				current.tools.push({
					toolUse: msg,
					toolResult: resultMap.get(parsed.toolUseId),
				});
				break;
			}
			case "tool_result":
				break;
			case "task_progress": {
				let node = taskMap.get(parsed.taskId);
				if (!node) {
					node = { taskId: parsed.taskId, progress: [] };
					taskMap.set(parsed.taskId, node);
					current.tasks.push(node);
				}
				node.progress.push(msg);
				break;
			}
			case "task_notification": {
				let node = taskMap.get(parsed.taskId);
				if (!node) {
					node = { taskId: parsed.taskId, progress: [] };
					taskMap.set(parsed.taskId, node);
					current.tasks.push(node);
				}
				node.notification = msg;
				break;
			}
			case "result":
			case "init":
			case "unknown":
				current.other.push(msg);
				break;
		}
	}

	if (
		current.text ||
		current.tools.length > 0 ||
		current.tasks.length > 0 ||
		current.other.length > 0
	) {
		turns.push(current);
	}

	return turns;
}

function MessagesSection({
	messages,
}: {
	messages: AgentSessionMessage[] | undefined;
}) {
	const [tab, setTab] = useState<"smart" | "raw">("smart");
	const turns = useMemo(() => buildTurns(messages ?? []), [messages]);

	return (
		<details className="group mb-4">
			<summary className="mb-2 flex cursor-pointer list-none items-center gap-1 font-medium text-gray-900">
				<span className="text-gray-400 text-xs transition-transform group-open:rotate-90">
					&#9654;
				</span>
				<span>Messages ({messages?.length ?? 0})</span>
				<div
					className="ml-2 flex rounded-lg bg-gray-100 p-0.5"
					onClick={(e) => e.preventDefault()}
				>
					<button
						className={`rounded-md px-3 py-1 font-medium text-xs transition-colors ${tab === "smart" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
						onClick={() => setTab("smart")}
						type="button"
					>
						Smart
					</button>
					<button
						className={`rounded-md px-3 py-1 font-medium text-xs transition-colors ${tab === "raw" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
						onClick={() => setTab("raw")}
						type="button"
					>
						Raw
					</button>
				</div>
			</summary>

			{tab === "smart" ? (
				<SmartMessages turns={turns} />
			) : (
				<RawMessages messages={messages} />
			)}
		</details>
	);
}

function SmartMessages({ turns }: { turns: Turn[] }) {
	if (turns.length === 0) {
		return <p className="text-gray-500 text-sm">No messages yet.</p>;
	}

	return (
		<div className="space-y-3">
			{turns.map((turn, i) => (
				<div className="rounded-lg border border-gray-200 bg-white" key={i}>
					{turn.other
						.filter((m) => m.message?.type === "init")
						.map((msg, j) => (
							<div
								className="border-gray-100 border-b px-4 py-2"
								key={`init-${j}`}
							>
								<span className="font-medium text-gray-400 text-xs">init</span>
								{msg.message && <MessageContent message={msg.message} />}
							</div>
						))}

					{turn.text?.message && (
						<div className="border-gray-100 border-b px-4 py-3">
							<pre className="m-0 whitespace-pre-wrap text-gray-800 text-sm">
								{(turn.text.message as { text: string }).text}
							</pre>
							<span className="mt-1 block text-gray-400 text-xs">
								{new Date(turn.text.timestamp).toLocaleTimeString()}
							</span>
						</div>
					)}

					{turn.tools.length > 0 && (
						<div className="divide-y divide-gray-100">
							{turn.tools.map((node) => {
								const toolMsg = node.toolUse.message as ParsedMessage & {
									type: "tool_use";
								};
								const resultMsg = node.toolResult?.message as
									| (ParsedMessage & { type: "tool_result" })
									| undefined;

								return (
									<details className="group" key={toolMsg.toolUseId}>
										<summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2 hover:bg-gray-50">
											<span className="text-gray-400 text-xs transition-transform group-open:rotate-90">
												&#9654;
											</span>
											<span
												className="font-medium font-mono text-xs"
												style={{ color: messageColor("tool_use") }}
											>
												{toolMsg.toolName}
											</span>
											{resultMsg?.isError && (
												<span className="rounded bg-red-100 px-1.5 py-0.5 text-red-600 text-xs">
													error
												</span>
											)}
											{resultMsg && !resultMsg.isError && (
												<span className="rounded bg-green-100 px-1.5 py-0.5 text-green-600 text-xs">
													ok
												</span>
											)}
											{!resultMsg && (
												<span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-600">
													pending
												</span>
											)}
											<span className="ml-auto text-gray-400 text-xs">
												{new Date(node.toolUse.timestamp).toLocaleTimeString()}
											</span>
										</summary>
										<div className="border-gray-100 border-t bg-gray-50 px-4 py-3">
											<div className="mb-2">
												<span className="mb-1 block font-medium text-gray-500 text-xs">
													Input
												</span>
												<pre className="max-h-48 overflow-auto rounded bg-gray-100 p-2 text-xs">
													{JSON.stringify(toolMsg.input, null, 2)}
												</pre>
											</div>
											{resultMsg && (
												<div>
													<span className="mb-1 block font-medium text-gray-500 text-xs">
														Output
													</span>
													<pre
														className={`max-h-48 overflow-auto rounded p-2 text-xs ${resultMsg.isError ? "bg-red-50 text-red-700" : "bg-green-50 text-gray-700"}`}
													>
														{resultMsg.content}
													</pre>
												</div>
											)}
										</div>
									</details>
								);
							})}
						</div>
					)}

					{turn.other
						.filter((m) => m.message?.type === "result")
						.map((msg, j) => (
							<div
								className="border-gray-100 border-t px-4 py-2"
								key={`result-${j}`}
							>
								{msg.message && <MessageContent message={msg.message} />}
							</div>
						))}

					{turn.tasks.map((task) => {
						const lastProgress = task.progress[task.progress.length - 1];
						const lastProgressMsg = lastProgress?.message as
							| (ParsedMessage & { type: "task_progress" })
							| undefined;
						const notificationMsg = task.notification?.message as
							| (ParsedMessage & { type: "task_notification" })
							| undefined;

						return (
							<details
								className="group border-gray-100 border-t"
								key={task.taskId}
							>
								<summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2 hover:bg-gray-50">
									<span className="text-gray-400 text-xs transition-transform group-open:rotate-90">
										&#9654;
									</span>
									<span
										className="font-medium font-mono text-xs"
										style={{ color: messageColor("task_progress") }}
									>
										task
									</span>
									{lastProgressMsg && (
										<span className="max-w-md truncate text-gray-500 text-xs">
											{lastProgressMsg.description}
										</span>
									)}
									{notificationMsg && (
										<StatusBadge status={notificationMsg.status} />
									)}
									{!notificationMsg && (
										<span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-600">
											running
										</span>
									)}
									{lastProgressMsg && (
										<span className="ml-auto text-gray-400 text-xs">
											{lastProgressMsg.usage.totalTokens} tokens,{" "}
											{lastProgressMsg.usage.toolUses} tools,{" "}
											{(lastProgressMsg.usage.durationMs / 1000).toFixed(1)}s
										</span>
									)}
								</summary>
								<div className="space-y-2 border-gray-100 border-t bg-gray-50 px-4 py-3">
									{task.progress.map((msg, j) => (
										<div key={j}>
											{msg.message && <MessageContent message={msg.message} />}
										</div>
									))}
									{task.notification?.message && (
										<div className="border-gray-200 border-t pt-2">
											<MessageContent message={task.notification.message} />
										</div>
									)}
								</div>
							</details>
						);
					})}
				</div>
			))}
		</div>
	);
}

function RawMessages({
	messages,
}: {
	messages: AgentSessionMessage[] | undefined;
}) {
	return (
		<div className="space-y-2">
			{messages?.map((msg, i) => {
				const parsed = msg.message;
				const msgType = parsed?.type ?? msg.type;
				const preview = getMessagePreview(parsed);

				return (
					<details
						className="group rounded-lg border-l-3 bg-gray-50"
						key={i}
						style={{ borderLeftColor: messageColor(msgType) }}
					>
						<summary className="flex cursor-pointer list-none items-center justify-between p-3">
							<div className="flex items-center gap-2">
								<span className="text-gray-400 text-xs transition-transform group-open:rotate-90">
									&#9654;
								</span>
								<span
									className="font-medium text-xs"
									style={{ color: messageColor(msgType) }}
								>
									{msgType}
								</span>
								{preview && (
									<span className="max-w-md truncate text-gray-500 text-xs">
										{preview.slice(0, 100)}
									</span>
								)}
							</div>
							<span className="text-gray-400 text-xs">
								{new Date(msg.timestamp).toLocaleTimeString()}
							</span>
						</summary>
						<div className="border-gray-200 border-t px-3 pt-2 pb-3">
							{parsed && <MessageContent message={parsed} />}
							{msg.raw != null && (
								<details className="mt-1">
									<summary className="cursor-pointer text-gray-400 text-xs hover:text-gray-600">
										Raw JSON
									</summary>
									<pre className="mt-1 max-h-96 overflow-auto rounded bg-gray-900 p-3 text-green-400 text-xs">
										{JSON.stringify(msg.raw, null, 2)}
									</pre>
								</details>
							)}
						</div>
					</details>
				);
			})}
			{messages?.length === 0 && (
				<p className="text-gray-500 text-sm">No messages yet.</p>
			)}
		</div>
	);
}

function getMessagePreview(msg: ParsedMessage | undefined): string | null {
	if (!msg) return null;
	switch (msg.type) {
		case "assistant_text":
			return msg.text;
		case "tool_use":
			return msg.toolName;
		case "tool_result":
			return msg.isError ? `Error: ${msg.content}` : msg.content;
		case "task_progress":
			return msg.description;
		case "task_notification":
			return `${msg.status}: ${msg.summary}`;
		case "result":
			return msg.result ?? msg.error ?? msg.subtype;
		case "init":
			return `model: ${msg.model}`;
		case "unknown":
			return msg.sdkType;
	}
}

function MessageContent({ message }: { message: ParsedMessage }) {
	switch (message.type) {
		case "assistant_text":
			return (
				<pre className="m-0 mb-2 whitespace-pre-wrap text-gray-700 text-sm">
					{message.text}
				</pre>
			);
		case "tool_use":
			return (
				<div className="mb-2 text-sm">
					<span className="font-medium text-gray-700">{message.toolName}</span>
					<pre className="mt-1 max-h-64 overflow-auto rounded bg-gray-100 p-2 text-xs">
						{JSON.stringify(message.input, null, 2)}
					</pre>
				</div>
			);
		case "tool_result":
			return (
				<pre
					className={`m-0 mb-2 max-h-64 overflow-auto whitespace-pre-wrap text-sm ${message.isError ? "text-red-600" : "text-gray-700"}`}
				>
					{message.content}
				</pre>
			);
		case "task_progress":
			return (
				<div className="mb-2 text-gray-700 text-sm">
					<p>{message.description}</p>
					{message.toolName && (
						<p className="text-gray-500 text-xs">Tool: {message.toolName}</p>
					)}
					<p className="text-gray-400 text-xs">
						{message.usage.totalTokens} tokens, {message.usage.toolUses} tool
						uses, {(message.usage.durationMs / 1000).toFixed(1)}s
					</p>
				</div>
			);
		case "task_notification":
			return (
				<div className="mb-2 text-sm">
					<StatusBadge status={message.status} />
					<pre className="mt-1 whitespace-pre-wrap text-gray-700">
						{message.summary}
					</pre>
				</div>
			);
		case "result":
			return (
				<div className="mb-2 text-sm">
					{message.result && (
						<pre className="whitespace-pre-wrap text-gray-700">
							{message.result}
						</pre>
					)}
					{message.error && (
						<pre className="whitespace-pre-wrap text-red-600">
							{message.error}
						</pre>
					)}
					<p className="mt-1 text-gray-400 text-xs">
						{message.numTurns} turns, {(message.durationMs / 1000).toFixed(1)}
						s, ${message.totalCostUsd.toFixed(4)}
					</p>
				</div>
			);
		case "init":
			return (
				<div className="mb-2 text-gray-700 text-sm">
					<p>Model: {message.model}</p>
					<p>Session: {message.sessionId}</p>
					<p className="text-gray-500 text-xs">
						Tools: {message.tools.join(", ")}
					</p>
				</div>
			);
		case "unknown":
			return (
				<pre className="m-0 mb-2 whitespace-pre-wrap text-gray-500 text-sm">
					Unknown ({message.sdkType})
					{message.raw != null && `\n${JSON.stringify(message.raw, null, 2)}`}
				</pre>
			);
	}
}

function messageColor(type: string): string {
	switch (type) {
		case "assistant_text":
			return "#3b82f6";
		case "tool_use":
			return "#8b5cf6";
		case "tool_result":
			return "#14b8a6";
		case "task_progress":
			return "#f59e0b";
		case "task_notification":
			return "#ec4899";
		case "result":
			return "#10b981";
		case "init":
			return "#6b7280";
		case "unknown":
			return "#9ca3af";
		default:
			return "#9ca3af";
	}
}
