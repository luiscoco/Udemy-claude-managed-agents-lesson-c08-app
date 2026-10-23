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

## How the application was developed

The browser collects inputs; the Node host validates requests; the lesson implementation produces observable evidence. The architecture page walks through the real source with numbered steps, prerequisite configuration, source filenames and code excerpts.

### Lesson implementation

[src/router.ts](https://github.com/luiscoco/Udemy-claude-managed-agents-lesson-c08-app/blob/main/src/router.ts)

```typescript
export type RoutedEvent = { type: string; id?: string; evaluated_permission?: string; [key: string]: unknown };
export type Sink = "preview" | "text" | "action" | "usage" | "lifecycle";
export function createRouter() {
  const seen = new Set<string>();
  return async (event: RoutedEvent, dispatch: (sink: Sink, event: RoutedEvent) => Promise<void> | void) => {
    if (event.type === "event_start" || event.type === "event_delta") { await dispatch("preview", event); return; }
    if (event.id && seen.has(event.id)) return;
    let sink: Sink = "lifecycle";
    if (event.type === "agent.message") sink = "text";
    else if (event.type === "agent.custom_tool_use" || event.evaluated_permission === "ask") sink = "action";
    else if (event.type === "span.model_request_end") sink = "usage";
    await dispatch(sink, event);
    if (event.id) seen.add(event.id);
  };
}
```

Read the architecture page for the remaining source excerpts and explanations, including input handling and optional provider behavior. The diagram describes this application, rather than implying that an external integration has been implemented.

## Validation

```powershell
npm test
python scripts/verify-walkthrough.py
```

The source hash check detects when walkthrough excerpts need refreshing. Browser verification covers page navigation, readable text, mobile layout, dark mode, diagram and image routes. Local scenarios and live provider calls are recorded separately in the workspace verification report; local success is not evidence of a live provider operation.

## Repository contents

Application sources, student web pages, safe configuration example and documentation images are included. `node_modules`, `presentation`, `output`, `reviewed`, `v3`, `teaching-material`, build output, local journals, credentials and local resource files are ignored. Existing teaching videos and presentations remain in the original workspace.
