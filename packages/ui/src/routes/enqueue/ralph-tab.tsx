import { useCallback, useMemo, useState } from "react";
import { $api } from "#api/client.ts";
import { detectUsedVars, filterRalphFiles, type TreeNode } from "./shared.ts";

interface RalphTabProps {
	tree: TreeNode[] | undefined;
	treeLoading: boolean;
	onSubmit: (body: Record<string, unknown>) => void;
	isPending: boolean;
}

export function RalphTab({
	tree,
	treeLoading,
	onSubmit,
	isPending,
}: RalphTabProps) {
	const [selectedPrompt, setSelectedPrompt] = useState("");
	const [vars, setVars] = useState<Record<string, string>>({});

	const { data: promptContent } = $api.useQuery(
		"get",
		"/api/config/file",
		{ params: { query: { path: selectedPrompt } } },
		{ enabled: !!selectedPrompt },
	);

	const ralphFiles = useMemo(() => {
		if (!tree) return [];
		return filterRalphFiles(tree);
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
			requiredPlugins: ["ralph-loop"],
		});
	}, [canSubmit, selectedPrompt, vars, onSubmit]);

	return (
		<>
			<section className="rounded-lg border border-gray-200 bg-white p-6">
				<h2 className="mb-1 font-medium text-gray-900 text-lg">
					Ralph Prompts
				</h2>
				<p className="mb-4 text-gray-500 text-sm">
					Select a ralph prompt to run with the{" "}
					<code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs">
						ralph-loop
					</code>{" "}
					plugin (max 3 iterations).
				</p>

				{treeLoading ? (
					<p className="text-gray-500 text-sm">Loading ralph files...</p>
				) : ralphFiles.length === 0 ? (
					<p className="text-gray-500 text-sm">
						No ralph prompt files found. Add .md files to the{" "}
						<code className="rounded bg-gray-100 px-1 font-mono text-xs">
							ralph/
						</code>{" "}
						config directory.
					</p>
				) : (
					<div className="space-y-2">
						{ralphFiles.map((file) => (
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
									name="ralph-prompt"
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

				{selectedPrompt && promptContent?.content && (
					<div className="mt-4">
						<h3 className="mb-2 font-medium text-gray-700 text-sm">Preview</h3>
						<pre className="max-h-48 overflow-auto rounded-lg bg-gray-50 p-4 font-mono text-gray-700 text-sm">
							{promptContent.content}
						</pre>
					</div>
				)}

				{selectedPrompt && usedVars.length > 0 && (
					<div className="mt-4">
						<h3 className="mb-2 font-medium text-gray-700 text-sm">
							Template Variables
						</h3>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							{usedVars.map((v) => (
								<div key={v.key}>
									<label
										className="mb-1 block font-medium text-gray-700 text-sm"
										htmlFor={`ralph-${v.key}`}
									>
										{v.label}
									</label>
									<input
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
										id={`ralph-${v.key}`}
										onChange={(e) => handleVarChange(v.key, e.target.value)}
										placeholder={v.placeholder}
										type="text"
										value={vars[v.key] ?? ""}
									/>
								</div>
							))}
						</div>
					</div>
				)}
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
