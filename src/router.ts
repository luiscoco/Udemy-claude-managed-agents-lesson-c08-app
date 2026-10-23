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
