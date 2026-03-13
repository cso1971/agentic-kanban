import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";

async function updateOrAppendKey(envPath: string, key: string, token: string) {
	let envContent = "";

	if (existsSync(envPath)) {
		envContent = await readFile(envPath, "utf-8");
	}

	if (envContent.includes(`${key}=`)) {
		envContent = envContent.replace(
			new RegExp(`^${key}=.*`, "m"),
			`${key}=${token}`,
		);
	} else {
		envContent = `${envContent.trimEnd()}\n${key}=${token}\n`;
	}

	await writeFile(envPath, envContent);
}

export const env = { updateOrAppendKey };
