# C08 · Routing Events to the Right Handler

Runs a real session through a local event router. Action events are displayed, not executed or approved. Deduplication is scoped to one run.

## Concepts students will learn

- Separate previews from persisted records
- Deduplicate after successful dispatch
- Route text, actions, usage and lifecycle events

## Configure and run

Use Node.js 24 or later. In PowerShell, from this repository's folder:

```powershell
node --version
npm ci
Copy-Item .env.example .env
notepad .env
```

Use your own Anthropic API key and an existing agent ID and environment ID.

For the optional live path, set your API key, then run npm run setup if you do not already have resource IDs. The script creates the environment before a text-only agent, saves each ID immediately, and reuses IDs already configured. It uses CLAUDE_MODEL or the source default; choose a model available to your account. An uncertain network failure may have created a resource: inspect your account before retrying.

```powershell
npm start
```

Open `http://127.0.0.1:3008`. Navigation leads to `/guide.html#learning`, `/guide.html#run-guide`, `/architecture.html`, and the application lab. If you change `PORT`, use the configured port. Keep the terminal running; stop with Ctrl+C. `npm run dev` also starts the web application.

Open the lab, read the stated resource operation, and press the main Run button once. Inspect the returned IDs, configuration or events. Each live run can create a remote resource.

## Create your .env file

Copy `.env.example` to `.env` and enter your own values. Do not commit the real file. Restart the server after editing it. The example contains safe placeholders; optional settings may be left blank to use source defaults. Resource IDs and keys stay on the server.

```dotenv
ANTHROPIC_API_KEY=your_api_key
CLAUDE_MANAGED_AGENT_ID=your_agent_id
CLAUDE_MANAGED_ENVIRONMENT_ID=your_environment_id
PORT=3008
```

## How the app was build

### 1. Handle transient previews before persisted-ID deduplication

Preview start/delta events go to their own sink. Persisted events then use the per-run ID Set so redelivery does not duplicate successful handling.

Source: [src/router.ts](src/router.ts#L4) · selected statements

```typescript
const seen = new Set<string>();

// ... other source statements omitted ...
if (event.type === "event_start" || event.type === "event_delta") {
  await dispatch("preview", event);
  return;
}

// ... other source statements omitted ...
if (event.id && seen.has(event.id)) return;
```

### 2. Choose a sink from the event contract

Text, actions and request usage have explicit routes, while other events retain the lifecycle default. An action sink displays a handoff; the sample does not execute or approve the action.

Source: [src/router.ts](src/router.ts#L8) · selected statements

```typescript
let sink: Sink = "lifecycle";

// ... other source statements omitted ...
if (event.type === "agent.message") sink = "text";
else if (
  event.type === "agent.custom_tool_use" ||
  event.evaluated_permission === "ask"
)
  sink = "action";
else if (event.type === "span.model_request_end") sink = "usage";
```

### 3. Mark an ID seen only after dispatch succeeds

Awaiting the sink before adding the ID permits a failed dispatch to be retried. Marking it first could hide an event that never reached its handler.

Source: [src/router.ts](src/router.ts#L12) · selected statements

```typescript
await dispatch(sink, event);

// ... other source statements omitted ...
if (event.id) seen.add(event.id);
```

## Validation

```powershell
npm test
python scripts/verify-walkthrough.py
```

The source hash check detects when walkthrough excerpts need refreshing. Browser verification covers page navigation, readable text, mobile layout, dark mode, diagram and image routes. Local scenarios and live provider calls are recorded separately in the workspace verification report; local success is not evidence of a live provider operation.

## Repository contents

Application sources, student web pages, safe configuration example and documentation images are included. `node_modules`, `presentation`, `output`, `reviewed`, `v3`, `teaching-material`, build output, local journals, credentials and local resource files are ignored. Existing teaching videos and presentations remain in the original workspace.
