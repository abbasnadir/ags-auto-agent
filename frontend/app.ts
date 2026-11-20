import 'dotenv/config';
import OpenAI from "openai";
import { agsTools, readLocalFile } from "../agent/tools/readFile.ts";

const client = new OpenAI({
  baseURL: process.env.OMNIROUTER_URL ?? "http://localhost:20128/v1",
  apiKey: process.env.OMNIROUTER_KEY
});

// Stops a model that keeps calling tools without ever answering.
const MAX_ROUNDS = 10;

async function runTool(call: OpenAI.Chat.Completions.ChatCompletionMessageToolCall): Promise<string> {
  if (call.type !== 'function' || call.function.name !== 'readLocalFile') {
    return `Error: unknown tool ${call.type === 'function' ? call.function.name : call.custom.name}`;
  }
  try {
    const { filePath } = JSON.parse(call.function.arguments);
    if (typeof filePath !== 'string') {
      return 'Error: filePath must be a string';
    }
    return await readLocalFile(filePath);
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

async function ask(question: string) {
  console.log('Agent started');
  console.log('Message sent:', question);
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [{ role: 'user', content: question }];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const response = await client.chat.completions.create({
      model: 'auto/best-fast',
      messages,
      tools: agsTools
    });
    const message = response.choices[0]?.message;
    if (!message) {
      throw new Error('The server returned no message');
    }
    messages.push(message);

    if (!message.tool_calls?.length) {
      console.log('Response received:', message.content);
      console.log('Agent stopped');
      return;
    }

    for (const call of message.tool_calls) {
      const result = await runTool(call);
      console.log('Tool call:', call.type === 'function' ? `${call.function.name}(${call.function.arguments})` : call.custom.name);
      console.log('Tool result:', result.startsWith('Error: ') ? result : `${Buffer.byteLength(result)} bytes`);
      messages.push({ role: 'tool', tool_call_id: call.id, content: result });
    }
  }

  throw new Error(`No answer after ${MAX_ROUNDS} model calls`);
}

(async () => {
  await ask("Read ./package.json and tell me which packages this project depends on.");
})();
