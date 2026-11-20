# ags-auto-agent

An early experiment in building an agent library on top of the OpenAI SDK. It wraps an OpenAI-compatible client in an `Agent` class that reports what it is doing through events, and has a working file-reading tool that the test script hands to the model.

It talks to any OpenAI-compatible server. During development that was a local model router at `http://localhost:20128/v1`.

## Demo

`frontend/app.ts` is the test script: it asks the model about `./package.json`, offers it the `readLocalFile` tool, runs the tool when the model calls it, sends the file back and prints the answer. This session ran it against a local stand-in for the router: a small proxy on port 4320 that forwarded requests to [Ollama](https://ollama.com/) and replaced the hard-coded model id `auto/best-fast` with `hf.co/mradermacher/Qwen-3.5-2b-roleplay-tuned-GGUF:Q4_K_M` (a 2B Qwen model). `OMNIROUTER_URL` pointed the script at the proxy.

```text
$ OMNIROUTER_URL=http://127.0.0.1:4320/v1 OMNIROUTER_KEY=local-stand-in node app.ts
Agent started
Message sent: Read ./package.json and tell me which packages this project depends on.
Tool call: readLocalFile({"filePath":"./package.json"})
Tool result: 540 bytes
Response received: Based on the `package.json` file, this project depends on the following packages:

**Production Dependencies:**
- **dotenv** - A package used to manage environment variables in Node.js applications
- **openai** - An API client for interacting with the OpenAI API

**Dev Dependencies:**
- **@types/node** - TypeScript types for the Node.js API

The project uses pnpm (version 12.14.0) as its package manager.
Agent stopped
```

*Recorded locally with Node 26 in `frontend/`, against Ollama behind a small proxy, model Qwen 3.5 2B (`hf.co/mradermacher/Qwen-3.5-2b-roleplay-tuned-GGUF:Q4_K_M`). The tool call and the answer come from the model; the model called the tool in each of the three runs made for this demo.*

## What’s here

- **`agent/app.ts`**: the `Agent` class. `on` and `off` register listeners for `start`, `message`, `response`, `stop`, `error`, `tool` and `tool_result`. `sendMessage` emits `start` and `message`, calls `chat.completions.create` with model `auto/best-fast`, then emits `response` with the first choice’s message and `stop`. Each call sends only the current message, so there is no conversation history yet. It doesn’t pass tools to the model, and the `tool` and `tool_result` events are never emitted.
- **`agent/tools/readFile.ts`**: the `readLocalFile` tool. `agsTools` is its schema (one `filePath` argument) in the Chat Completions format, and `readLocalFile(filePath)` reads the file. It only reads files inside the working directory: paths that leave it, including through `..`, an absolute path or a symlink, are refused, and so are files over 64 KiB and anything that isn’t a regular file.
- **`agent/list_models.ts`**: prints the model ids the router offers.
- **`frontend/app.ts`**: the test script shown above. It runs the tool loop itself with the OpenAI client: it sends the conversation with `agsTools`, runs each `readLocalFile` call, adds the result (or `Error: ...`) as a `tool` message and asks again, until the model answers without a tool call. It gives up after 10 rounds.

## Run it locally

Needs Node 22.18 or newer (the `.ts` files run directly with Node’s type stripping; this was run on Node 26.13) and pnpm.

```bash
cd agent && pnpm install
cd ../frontend && pnpm install
```

Both installs are needed, because `frontend/app.ts` loads `../agent/tools/readFile.ts`, which takes `openai` from `agent/node_modules`. With pnpm 12 the `agent` install prints `ERR_PNPM_IGNORED_BUILDS` for esbuild (a dependency of `tsx`); the packages are still installed and the scripts above don’t need it. Run `pnpm approve-builds` if you want to use `pnpm dev`.

Point the client at your server and run the test script:

```bash
cd frontend
OMNIROUTER_KEY=... node app.ts
```

The script reads files relative to the directory you run it from, so run it from `frontend/` for the question about `./package.json`.

The `baseURL` `http://localhost:20128/v1` is set in `agent/list_models.ts`. `frontend/app.ts` uses the same URL unless `OMNIROUTER_URL` is set. The model id `auto/best-fast` is set in `agent/app.ts` and `frontend/app.ts`. To use another server, such as Ollama’s OpenAI-compatible endpoint at `http://localhost:11434/v1`, set `OMNIROUTER_URL` and change the model id, or put a proxy in front that maps the model id, as the demo did. The model has to support tool calls.

| Variable | Purpose |
| --- | --- |
| `OMNIROUTER_KEY` | API key sent to the OpenAI-compatible server (read from the environment or a `.env` file through `dotenv`) |
| `OMNIROUTER_URL` | Base URL for `frontend/app.ts` (default `http://localhost:20128/v1`) |

`node list_models.ts` in `agent/` lists the server’s models. There are no tests.

## Project structure

```text
agent/
  app.ts              Agent class: events and sendMessage
  tools/readFile.ts   readLocalFile tool: schema and file reader
  list_models.ts      lists the server's models
frontend/
  app.ts              test script: tool loop with readLocalFile
```
