import OpenAI from "openai";
import 'dotenv/config';

const client = new OpenAI({
    baseURL: "http://localhost:20128/v1",
    apiKey: process.env.OMNIROUTER_KEY
});

async function listModels() {
  const response = await client.models.list();

  for (const model of response.data) {
    console.log(model.id);
  }
}

listModels().catch(console.error);