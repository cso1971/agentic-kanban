export interface TreeNode {
	name: string;
	path: string;
	type: "file" | "directory";
	children?: TreeNode[];
}

export const TEMPLATE_VARS = [
	{ key: "projectId", label: "Project ID", placeholder: "e.g. 1" },
	{ key: "issueId", label: "Issue IID", placeholder: "e.g. 42" },
	{
		key: "issueTitle",
		label: "Issue Title",
		placeholder: "e.g. Add login page",
	},
	{
		key: "issueDescription",
		label: "Issue Description",
		placeholder: "Describe the issue...",
	},
	{ key: "mrIid", label: "MR IID", placeholder: "e.g. 10" },
	{ key: "mrTitle", label: "MR Title", placeholder: "e.g. feat: add auth" },
	{
		key: "sourceBranch",
		label: "Source Branch",
		placeholder: "e.g. feature/auth",
	},
	{ key: "reviewerName", label: "Reviewer Name", placeholder: "e.g. John" },
	{ key: "discussionId", label: "Discussion ID", placeholder: "" },
	{
		key: "reviewComment",
		label: "Review Comment",
		placeholder: "e.g. Please fix...",
	},
] as const;

const VAR_KEY_TO_TEMPLATE: Record<string, string> = {
	projectId: "PROJECT_ID",
	issueId: "ISSUE_IID",
	issueTitle: "ISSUE_TITLE",
	issueDescription: "ISSUE_DESCRIPTION",
	mrIid: "MR_IID",
	mrTitle: "MR_TITLE",
	sourceBranch: "SOURCE_BRANCH",
	reviewerName: "REVIEWER_NAME",
	discussionId: "DISCUSSION_ID",
	reviewComment: "REVIEW_COMMENT",
};

export function detectUsedVars(content: string) {
	return TEMPLATE_VARS.filter((v) => {
		const templateKey = VAR_KEY_TO_TEMPLATE[v.key] ?? "";
		return content.includes(`{{${templateKey}}}`);
	});
}

export function collectMdFiles(nodes: TreeNode[], prefix = ""): string[] {
	const files: string[] = [];
	for (const node of nodes) {
		if (node.type === "directory" && node.children) {
			files.push(...collectMdFiles(node.children, `${prefix}${node.name}/`));
		} else if (node.type === "file" && node.name.endsWith(".md")) {
			files.push(node.path);
		}
	}
	return files;
}

export function filterTriggerFiles(nodes: TreeNode[]): string[] {
	for (const node of nodes) {
		if (
			node.type === "directory" &&
			node.name === "triggers" &&
			node.children
		) {
			return collectMdFiles(node.children);
		}
	}
	return collectMdFiles(nodes);
}

export function filterRalphFiles(nodes: TreeNode[]): string[] {
	for (const node of nodes) {
		if (node.type === "directory" && node.name === "ralph" && node.children) {
			return collectMdFiles(node.children);
		}
	}
	return [];
}

export function extractFolderEntries(
	nodes: TreeNode[],
	dirName: string,
): { name: string; promptPath: string }[] {
	for (const node of nodes) {
		if (node.type === "directory" && node.name === dirName && node.children) {
			return node.children
				.filter((child) => child.type === "directory")
				.map((child) => ({
					name: child.name,
					promptPath: `${child.path}/agent.md`,
				}));
		}
	}
	return [];
}
