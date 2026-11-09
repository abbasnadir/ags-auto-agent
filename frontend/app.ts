import 'dotenv/config';
import { Agent } from "../agent/app.ts";

const client = {
  baseURL: "http://localhost:20128/v1",
  apiKey: process.env.OMNIROUTER_KEY
};

const agent = new Agent(client);

agent.on('start', () => {
  console.log('Agent started');
});

agent.on('message', (message) => {
  console.log('Message sent:', message);
});

agent.on('response', (response) => {
  console.log('Response received:', response);
});

agent.on('stop', () => {
  console.log('Agent stopped');
});

(async () => {
  await agent.sendMessage("Hello, I want to test if the agent is reachable!");
})();