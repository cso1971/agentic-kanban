import { $api } from "#api/client.ts";

export function IntegrationsPage() {
	const { data, isLoading } = $api.useQuery("get", "/api/integrations");

	if (isLoading) {
		return (
			<div className="p-6">
				<h1 className="mb-6 font-semibold text-2xl text-gray-900">
					Integrations
				</h1>
				<p className="text-gray-500">Loading...</p>
			</div>
		);
	}

	return (
		<div className="p-6">
			<h1 className="mb-6 font-semibold text-2xl text-gray-900">
				Integrations
			</h1>

			<div className="space-y-6">
				<section className="rounded-lg border border-gray-200 bg-white p-6">
					<h2 className="mb-4 font-medium text-gray-900 text-lg">
						Config Directory
					</h2>
					<p className="font-mono text-gray-700 text-sm">
						{data?.configDir ?? "—"}
					</p>
				</section>

				<section className="rounded-lg border border-gray-200 bg-white p-6">
					<h2 className="mb-4 font-medium text-gray-900 text-lg">
						GitLab Integration
					</h2>
					<div className="flex items-center gap-3">
						<span className="font-mono text-gray-700 text-sm">
							{data?.gitlab.url || "Not configured"}
						</span>
						{data?.gitlab.connected ? (
							<span className="rounded-full bg-green-100 px-2.5 py-0.5 font-medium text-green-800 text-xs">
								Connected
							</span>
						) : (
							<span className="rounded-full bg-red-100 px-2.5 py-0.5 font-medium text-red-800 text-xs">
								Disconnected
							</span>
						)}
					</div>
				</section>
			</div>
		</div>
	);
}
