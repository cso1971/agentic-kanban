import { useCallback, useMemo, useState } from "react";
import { $api } from "#api/client.ts";
import { detectUsedVars, filterTriggerFiles, type TreeNode } from "./shared.ts";

interface TriggerFileTabProps {
	tree: TreeNode[] | undefined;
	treeLoading: boolean;
	onSubmit: (body: Record<string, unknown>) => void;
	isPending: boolean;
}

export function TriggerFileTab({
	tree,
	treeLoading,
	onSubmit,
	isPending,
}: TriggerFileTabProps) {
	const [selectedPrompt, setSelectedPrompt] = useState("");
	const [vars, setVars] = useState<Record<string, string>>({});

	const { data: promptContent } = $api.useQuery(
		"get",
		"/api/config/file",
		{ params: { query: { path: selectedPrompt } } },
		{ enabled: !!selectedPrompt },
	);

	const triggerFiles = useMemo(() => {
		if (!tree) return [];
		return filterTriggerFiles(tree);
	}, [tree]);

	const usedVars = useMemo(
		() => detectUsedVars(promptContent?.content ?? ""),
		[promptContent?.content],
	);

	const handleVarChange = useCallback((key: string, value: string) => {
		setVars((prev) => ({ ...prev, [key]: value }));
	}, []);

	const canSubmit = !!selectedPrompt;

	const handleSubmit = useCallback(() => {
		if (!canSubmit) return;
		onSubmit({
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
		});
	}, [canSubmit, selectedPrompt, vars, onSubmit]);

	return (
		<>
			<section className="rounded-lg border border-gray-200 bg-white p-6">
				<h2 className="mb-3 font-medium text-gray-900 text-lg">Prompt File</h2>
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
									onChange={() => setSelectedPrompt(file)}
									type="radio"
								/>
								<div>
									<span className="font-medium text-gray-900 text-sm">
										{file.split("/").pop()}
									</span>
									<span className="ml-2 text-gray-400 text-xs">{file}</span>
								</div>
							</label>
						))}
					</div>
				)}
			</section>

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
								{v.key === "issueDescription" || v.key === "reviewComment" ? (
									<textarea
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
										id={v.key}
										onChange={(e) => handleVarChange(v.key, e.target.value)}
										placeholder={v.placeholder}
										rows={3}
										value={vars[v.key] ?? ""}
									/>
								) : (
									<input
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
										id={v.key}
										onChange={(e) => handleVarChange(v.key, e.target.value)}
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
