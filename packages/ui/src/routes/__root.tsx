import { Link, Outlet } from "@tanstack/react-router";

export function RootLayout() {
	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="bg-white border-b border-gray-200 px-6 py-4">
				<div className="flex items-center gap-6">
					<Link to="/" className="text-xl font-semibold text-gray-900">
						Agents
					</Link>
					<Link
						to="/invocations"
						className="text-gray-600 hover:text-gray-900 [&.active]:text-blue-600 [&.active]:font-medium"
					>
						Invocations
					</Link>
				</div>
			</nav>
			<main>
				<Outlet />
			</main>
		</div>
	);
}
