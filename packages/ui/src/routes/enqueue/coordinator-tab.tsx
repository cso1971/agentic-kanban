import { useCallback, useMemo, useState } from "react";
import { type TreeNode, extractFolderEntries } from "./shared.ts";

interface CoordinatorTabProps {
	tree: TreeNode[] | undefined;
	treeLoading: boolean;
	onSubmit: (body: Record<string, unknown>) => void;
	isPending: boolean;
}

export function CoordinatorTab({
	tree,
	treeLoading,
	onSubmit,
	isPending,
}: CoordinatorTabProps) {
	const [selectedCoordinator, setSelectedCoordinator] = useState("");
	const [selectedTeammates, setSelectedTeammates] = useState<string[]>([]);
	const [topic, setTopic] = useState("");

	const coordinators = useMemo(() => {
		if (!tree) return [];
		return extractFolderEntries(tree, "coordinators");
	}, [tree]);

	const agents = useMemo(() => {
		if (!tree) return [];
		return extractFolderEntries(tree, "agents");
	}, [tree]);

	const toggleTeammate = useCallback((agentName: string) => {
		setSelectedTeammates((prev) =>
			prev.includes(agentName)
				? prev.filter((n) => n !== agentName)
				: [...prev, agentName],
		);
	}, []);

	const canSubmit =
		!!selectedCoordinator &&
		selectedTeammates.length > 0 &&
		topic.trim().length > 0;

	const handleSubmit = useCallback(() => {
		if (!canSubmit) return;
		onSubmit({
			promptPath: selectedCoordinator,
			projectId: "",
			issueTitle: topic.trim(),
			teammates: selectedTeammates,
		});
	}, [canSubmit, selectedCoordinator, topic, selectedTeammates, onSubmit]);

	return (
		<>
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
									onChange={() => setSelectedCoordinator(c.promptPath)}
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

			<div className="flex items-center gap-4">
				<button
					className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
					disabled={!canSubmit || isPending}
					onClick={handleSubmit}
					type="button"
				>
					{isPending ? "Enqueuing..." : "Enqueue Agent Run"}
				</button>
			</div>
		</>
	);
}
