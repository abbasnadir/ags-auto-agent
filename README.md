# ags-auto-agent

An early experiment in building an agent library on top of the OpenAI SDK. It wraps an OpenAI-compatible client in an `Agent` class that reports what it is doing through events, and starts on tool calling with a schema for a file-reading tool.

It talks to any OpenAI-compatible server. During development that was a local model router at `http://localhost:20128/v1`.

## Demo

`frontend/app.ts` is the test script: it creates an `Agent`, logs each event, and sends one message. This session ran it against a local stand-in for the router: a small proxy on port 4400 that forwarded requests to [Ollama](https://ollama.com/) and replaced the agent’s hard-coded model id `auto/best-fast` with `hf.co/mradermacher/Qwen-3.5-2b-roleplay-tuned-GGUF:Q4_K_M` (a 2B Qwen model). The only change to the script was the `baseURL`.

```text
$ OMNIROUTER_KEY=local-stand-in node demo.ts
Agent started
Message sent: Hello, I want to test if the agent is reachable!
Response received: {
  role: 'assistant',
  content: "Hello! I'd be happy to help test if the agent is reachable. Could you clarify what specific task or function you'd like me to perform for this test? This will help me ensure I'm meeting your expectations and capabilities. For example, are you looking for help with a particular task, debugging a system, or verifying my ability to handle complex requests? Let me know, and I'll tailor my response accordingly!",
  reasoning: `Okay, the user is asking me to test if the agent is reachable. Let me figure out what they need here. They mentioned "the agent," so I need to understand the context. Are they referring to a specific AI agent or a particular system? Maybe they're testing my own capabilities or checking if I can handle certain tasks.\n` +
    '\n' +
    'First, I should acknowledge their request and confirm my understanding. They want me to verify reachability. I need to make sure I understand what "reachable" means in this context. Is it about my ability to perform tasks, respond appropriately, or something else? \n' +
    '\n' +
    `I should ask for more details to provide a more accurate response. What exactly do they mean by "test"? Are they looking for my capabilities, or is it part of a larger system's test process? Maybe they're testing a new agent and want to see if I can recognize it.\n` +
    '\n' +
    "Wait, perhaps the user is referring to a specific agent they have in mind. They might want to know if their current agent is functional or if there's an issue with the system. I need to clarify the context to give a helpful answer.\n" +
    '\n' +
    'I should respond in a friendly way, confirming their request and offering to assist further. Maybe they need help setting up the test or troubleshooting something. Let me structure the response to show I understand the request and am ready to help, but I need more information to provide a precise answer.'
}
Agent stopped
```

*Recorded locally with Node 26 and a stand-in server (Ollama behind a small proxy), model Qwen 3.5 2B. The `reasoning` field comes from the model’s thinking output, which Ollama returns alongside the reply.*

## What’s here

- **`agent/app.ts`**: the `Agent` class. `on` and `off` register listeners for `start`, `message`, `response`, `stop`, `error`, `tool` and `tool_result`. `sendMessage` emits `start` and `message`, calls `chat.completions.create` with model `auto/best-fast`, then emits `response` with the first choice’s message and `stop`. Each call sends only the current message, so there is no conversation history yet.
- **`agent/tools/readFile.ts`**: the JSON schema for a `readLocalFile` tool (one `filePath` argument). It isn’t passed to the model or implemented yet, and the `tool` and `tool_result` events are never emitted.
- **`agent/list_models.ts`**: prints the model ids the router offers.
- **`frontend/app.ts`**: the test script shown above, importing the class straight from `../agent/app.ts`.

## Run it locally

Needs Node 22.18 or newer (the `.ts` files run directly with Node’s type stripping; this was run on Node 26.13) and pnpm.

```bash
cd agent && pnpm install
cd ../frontend && pnpm install
```

Both installs are needed, because `frontend/app.ts` loads `../agent/app.ts`, which takes `openai` from `agent/node_modules`. With pnpm 12 the `agent` install prints `ERR_PNPM_IGNORED_BUILDS` for esbuild (a dependency of `tsx`); the packages are still installed and the scripts above don’t need it. Run `pnpm approve-builds` if you want to use `pnpm dev`.

Point the client at your server and run the test script:

```bash
cd frontend
OMNIROUTER_KEY=... node app.ts
```

The `baseURL` (`http://localhost:20128/v1`) is set in `frontend/app.ts` and `agent/list_models.ts`, and the model id `auto/best-fast` in `agent/app.ts`. To use another server, such as Ollama’s OpenAI-compatible endpoint at `http://localhost:11434/v1`, change those values, or put a proxy in front that maps the model id, as the demo did.

| Variable | Purpose |
| --- | --- |
| `OMNIROUTER_KEY` | API key sent to the OpenAI-compatible server (read from the environment or a `.env` file through `dotenv`) |

`node list_models.ts` in `agent/` lists the server’s models. There are no tests.

## Project structure

```text
agent/
  app.ts              Agent class: events and sendMessage
  tools/readFile.ts   readLocalFile tool schema (not wired up yet)
  list_models.ts      lists the server's models
frontend/
  app.ts              test script that uses the Agent and logs its events
```
