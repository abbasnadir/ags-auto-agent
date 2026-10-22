import OpenAI from "openai";

export const agsTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
        type: "function",
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
];