import { Link } from "@tanstack/react-router";
import { $api } from "#api/client.ts";

export function Dashboard() {
	const { data: sessions, isLoading } = $api.useQuery(
		"get",
		"/api/agent-sessions",
		undefined,
		{
			refetchInterval: 5000,
		},
	);

	const running =
		sessions?.filter((s) => s.status === "running").length ?? 0;
	const completed =
		sessions?.filter((s) => s.status === "completed").length ?? 0;
	const failed = sessions?.filter((s) => s.status === "failed").length ?? 0;
	const total = sessions?.length ?? 0;

	return (
		<div className="p-6">
			<h1 className="mb-6 font-semibold text-2xl text-gray-900">Dashboard</h1>

			{isLoading ? (
				<p className="text-gray-500">Loading...</p>
			) : (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
					<StatCard label="Total Sessions" value={total} />
					<StatCard color="yellow" label="Running" value={running} />
					<StatCard color="green" label="Completed" value={completed} />
					<StatCard color="red" label="Failed" value={failed} />
				</div>
			)}

			<div className="mt-6">
				<Link
					className="font-medium text-blue-600 hover:text-blue-800"
					to="/agent-sessions"
				>
					View all agent sessions →
				</Link>
			</div>
		</div>
	);
}

function StatCard({
	label,
	value,
	color,
}: {
	label: string;
	value: number;
	color?: "yellow" | "green" | "red";
}) {
	const colorClasses = {
		yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
		green: "bg-green-50 border-green-200 text-green-700",
		red: "bg-red-50 border-red-200 text-red-700",
	};

	return (
		<div
			className={`rounded-lg border p-4 ${color ? colorClasses[color] : "border-gray-200 bg-white"}`}
		>
			<p className="text-gray-500 text-sm">{label}</p>
			<p className={`font-semibold text-3xl ${color ? "" : "text-gray-900"}`}>
				{value}
			</p>
		</div>
	);
}
