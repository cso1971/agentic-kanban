import { useCallback, useState } from "react";

interface FreeTextTabProps {
	onSubmit: (body: Record<string, unknown>) => void;
	isPending: boolean;
}

export function FreeTextTab({ onSubmit, isPending }: FreeTextTabProps) {
	const [promptText, setPromptText] = useState("");

	const canSubmit = promptText.trim().length > 0;

	const handleSubmit = useCallback(() => {
		if (!canSubmit) return;
		onSubmit({ promptText: promptText.trim(), projectId: "" });
	}, [canSubmit, promptText, onSubmit]);

	return (
		<>
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
