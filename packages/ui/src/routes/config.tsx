import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { $api } from "../api/client";

interface TreeNode {
	name: string;
	path: string;
	type: "file" | "directory";
	children?: TreeNode[];
}

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"];

function isImageFile(path: string): boolean {
	return IMAGE_EXTENSIONS.some((ext) => path.toLowerCase().endsWith(ext));
}

function isMarkdownFile(path: string): boolean {
	return path.toLowerCase().endsWith(".md");
}

export function ConfigPage() {
	const [selectedPath, setSelectedPath] = useState<string | null>(null);

	const { data: treeData, isLoading: treeLoading } = $api.useQuery(
		"get",
		"/api/config/tree",
	);

	return (
		<div className="flex h-[calc(100vh-65px)]">
			{/* Sidebar - File Tree */}
			<div className="w-72 overflow-auto border-gray-200 border-r bg-white p-4">
				<h2 className="mb-4 font-semibold text-gray-900 text-lg">
					Config Files
				</h2>
				{treeLoading && <p className="text-gray-500 text-sm">Loading...</p>}
				{treeData?.tree && (
					<FileTree
						nodes={treeData.tree as TreeNode[]}
						onSelect={setSelectedPath}
						selectedPath={selectedPath}
					/>
				)}
			</div>

			{/* Main Content */}
			<div className="flex-1 overflow-auto">
				{selectedPath ? (
					<FileViewer path={selectedPath} />
				) : (
					<div className="flex h-full items-center justify-center">
						<p className="text-gray-500">
							Select a file from the tree to view or edit.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

function FileTree({
	nodes,
	onSelect,
	selectedPath,
	depth = 0,
}: {
	nodes: TreeNode[];
	onSelect: (path: string) => void;
	selectedPath: string | null;
	depth?: number;
}) {
	return (
		<div>
			{nodes.map((node) => (
				<FileTreeNode
					depth={depth}
					key={node.path}
					node={node}
					onSelect={onSelect}
					selectedPath={selectedPath}
				/>
			))}
		</div>
	);
}

function FileTreeNode({
	node,
	onSelect,
	selectedPath,
	depth,
}: {
	node: TreeNode;
	onSelect: (path: string) => void;
	selectedPath: string | null;
	depth: number;
}) {
	const [expanded, setExpanded] = useState(true);
	const isSelected = selectedPath === node.path;

	if (node.type === "directory") {
		return (
			<div>
				<button
					className={`flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-sm hover:bg-gray-100 ${
						isSelected ? "bg-blue-50 text-blue-700" : "text-gray-700"
					}`}
					onClick={() => setExpanded(!expanded)}
					style={{ paddingLeft: `${depth * 16 + 8}px` }}
					type="button"
				>
					<span className="text-gray-400 text-xs">
						{expanded ? "▼" : "▶"}
					</span>
					<span className="text-gray-400">📁</span>
					<span className="font-medium">{node.name}</span>
				</button>
				{expanded && node.children && (
					<FileTree
						depth={depth + 1}
						nodes={node.children}
						onSelect={onSelect}
						selectedPath={selectedPath}
					/>
				)}
			</div>
		);
	}

	const icon = isImageFile(node.name)
		? "🖼️"
		: isMarkdownFile(node.name)
			? "📝"
			: "📄";

	return (
		<button
			className={`flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-sm hover:bg-gray-100 ${
				isSelected
					? "bg-blue-50 font-medium text-blue-700"
					: "text-gray-700"
			}`}
			onClick={() => onSelect(node.path)}
			style={{ paddingLeft: `${depth * 16 + 8}px` }}
			type="button"
		>
			<span className="text-gray-400">{icon}</span>
			<span>{node.name}</span>
		</button>
	);
}

function FileViewer({ path }: { path: string }) {
	if (isImageFile(path)) {
		return <ImageViewer path={path} />;
	}

	return <TextFileViewer path={path} />;
}

function ImageViewer({ path }: { path: string }) {
	const imageUrl = `/api/config/image?path=${encodeURIComponent(path)}`;

	return (
		<div className="p-6">
			<div className="mb-4 flex items-center justify-between">
				<h2 className="font-semibold text-gray-900 text-lg">{path}</h2>
			</div>
			<div className="inline-block overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-4">
				<img
					alt={path}
					className="max-h-96 max-w-full object-contain"
					src={imageUrl}
				/>
			</div>
		</div>
	);
}

function TextFileViewer({ path }: { path: string }) {
	const [editing, setEditing] = useState(false);
	const [editContent, setEditContent] = useState("");

	const { data: fileData, isLoading, refetch } = $api.useQuery(
		"get",
		"/api/config/file",
		{ params: { query: { path } } },
	);

	const saveMutation = $api.useMutation("put", "/api/config/file");

	// Reset editing state when path changes
	useEffect(() => {
		setEditing(false);
	}, [path]);

	const handleEdit = useCallback(() => {
		if (fileData?.content) {
			setEditContent(fileData.content);
			setEditing(true);
		}
	}, [fileData?.content]);

	const handleSave = useCallback(async () => {
		await saveMutation.mutateAsync({
			params: { query: { path } },
			body: { content: editContent },
		});
		setEditing(false);
		refetch();
	}, [saveMutation, path, editContent, refetch]);

	const handleCancel = useCallback(() => {
		setEditing(false);
	}, []);

	if (isLoading) {
		return (
			<div className="p-6">
				<p className="text-gray-500">Loading...</p>
			</div>
		);
	}

	const content = fileData?.content ?? "";
	const isMarkdown = isMarkdownFile(path);

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-gray-200 border-b bg-white px-6 py-3">
				<h2 className="font-semibold text-gray-900 text-lg">{path}</h2>
				<div className="flex gap-2">
					{editing ? (
						<>
							<button
								className="rounded bg-gray-200 px-3 py-1.5 text-gray-700 text-sm hover:bg-gray-300"
								onClick={handleCancel}
								type="button"
							>
								Cancel
							</button>
							<button
								className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
								disabled={saveMutation.isPending}
								onClick={handleSave}
								type="button"
							>
								{saveMutation.isPending ? "Saving..." : "Save"}
							</button>
						</>
					) : (
						<button
							className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
							onClick={handleEdit}
							type="button"
						>
							Edit
						</button>
					)}
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-auto">
				{editing ? (
					<textarea
						className="h-full w-full resize-none border-none bg-gray-50 p-6 font-mono text-sm outline-none"
						onChange={(e) => setEditContent(e.target.value)}
						value={editContent}
					/>
				) : isMarkdown ? (
					<div className="prose prose-sm max-w-none p-6">
						<ReactMarkdown remarkPlugins={[remarkGfm]}>
							{content}
						</ReactMarkdown>
					</div>
				) : (
					<pre className="whitespace-pre-wrap p-6 font-mono text-sm">
						{content}
					</pre>
				)}
			</div>
		</div>
	);
}
