import OpenAI from "openai";
import 'dotenv/config';
import { agsTools } from "./tools/readFile.js";

const client = new OpenAI({
  baseURL: "http://localhost:20128/v1",
  apiKey: process.env.OMNIROUTER_KEY
});

async function testConnection() {
  const response = await client.chat.completions.create({
    model: 'auto/best-fast',
    messages: [{ role: 'user', content: 'What are the dependencies in my ./package.json file?' }],
    tools: agsTools,
    tool_choice: "auto"
  });

 
  console.log(response);
}

testConnection().catch(console.error);