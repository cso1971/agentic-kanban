import { Link, Outlet } from "@tanstack/react-router";

export function RootLayout() {
	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="border-gray-200 border-b bg-white px-6 py-4">
				<div className="flex items-center gap-6">
					<Link className="font-semibold text-gray-900 text-xl" to="/">
						Agents
					</Link>
					<Link
						className="text-gray-600 hover:text-gray-900 [&.active]:font-medium [&.active]:text-blue-600"
						to="/agent-sessions"
					>
						Agent Sessions
					</Link>
					<Link
						className="text-gray-600 hover:text-gray-900 [&.active]:font-medium [&.active]:text-blue-600"
						to="/config"
					>
						Config
					</Link>
					<Link
						className="text-gray-600 hover:text-gray-900 [&.active]:font-medium [&.active]:text-blue-600"
						to="/enqueue"
					>
						Enqueue
					</Link>
					<Link
						className="text-gray-600 hover:text-gray-900 [&.active]:font-medium [&.active]:text-blue-600"
						to="/integrations"
					>
						Integrations
					</Link>
				</div>
			</nav>
			<main>
				<Outlet />
			</main>
		</div>
	);
}
