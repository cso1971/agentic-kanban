import { Link } from "@tanstack/react-router";
import { $api } from "../api/client";

export function Dashboard() {
	const { data: invocations, isLoading } = $api.useQuery("get", "/api/invocations", undefined, {
		refetchInterval: 5000,
	});

	const running = invocations?.filter((i) => i.status === "running").length ?? 0;
	const completed = invocations?.filter((i) => i.status === "completed").length ?? 0;
	const failed = invocations?.filter((i) => i.status === "failed").length ?? 0;
	const total = invocations?.length ?? 0;

	return (
		<div className="p-6">
			<h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>

			{isLoading ? (
				<p className="text-gray-500">Loading...</p>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<StatCard label="Total Invocations" value={total} />
					<StatCard label="Running" value={running} color="yellow" />
					<StatCard label="Completed" value={completed} color="green" />
					<StatCard label="Failed" value={failed} color="red" />
				</div>
			)}

			<div className="mt-6">
				<Link
					to="/invocations"
					className="text-blue-600 hover:text-blue-800 font-medium"
				>
					View all invocations →
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
			className={`p-4 rounded-lg border ${color ? colorClasses[color] : "bg-white border-gray-200"}`}
		>
			<p className="text-sm text-gray-500">{label}</p>
			<p className={`text-3xl font-semibold ${color ? "" : "text-gray-900"}`}>
				{value}
			</p>
		</div>
	);
}
