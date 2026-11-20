import OpenAI from "openai";
import { Buffer } from "node:buffer";
import { open, realpath, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

export const agsTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
        type: "function",
        function: {
            name: "readLocalFile",
            description: "Reads the content of a local file. Use this to inspect code.",
            parameters: {
                type: "object",
                properties: {
                    filePath: {
                        type: "string",
                        description: "The path to the file (e.g., './package.json')"
                    }
                },
                required: ["filePath"]
            }
        }
    }
];

export const MAX_FILE_BYTES = 64 * 1024;

// Reads a file inside `root` (the working directory by default). Paths that
// leave `root`, also through symlinks, and files over MAX_FILE_BYTES are rejected.
export async function readLocalFile(filePath: string, root: string = process.cwd()): Promise<string> {
    const base = await realpath(root);
    const isInside = (target: string) => {
        const relative = path.relative(base, target);
        return relative !== ".." && !relative.startsWith(".." + path.sep) && !path.isAbsolute(relative);
    };

    // Checked before and after resolving symlinks, so nothing outside is even looked up.
    const requested = path.resolve(base, filePath);
    if (!isInside(requested)) {
        throw new Error(`${filePath} is outside ${base}`);
    }
    const target = await realpath(requested);
    if (!isInside(target)) {
        throw new Error(`${filePath} is outside ${base}`);
    }

    if (!(await stat(target)).isFile()) {
        throw new Error(`${filePath} is not a file`);
    }

    const file = await open(target, "r");
    try {
        const buffer = Buffer.alloc(MAX_FILE_BYTES + 1);
        const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
        if (bytesRead > MAX_FILE_BYTES) {
            throw new Error(`${filePath} is larger than ${MAX_FILE_BYTES} bytes`);
        }
        return buffer.toString("utf8", 0, bytesRead);
    } finally {
        await file.close();
    }
}
