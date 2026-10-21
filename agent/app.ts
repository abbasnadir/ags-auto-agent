import OpenAI from "openai";
import 'dotenv/config';

const client = new OpenAI({
  baseURL: "http://localhost:20128/v1",
  apiKey: process.env.OMNIROUTER_KEY
});

async function testConnection() {
  const response = await client.chat.completions.create({
    model: 'auto/best-fast',
    messages: [{ role: 'user', content: 'Hello!' }],
  });

  console.log(response.choices[0]?.message?.content ?? "No response");

  console.log(response);
}

testConnection().catch(console.error);