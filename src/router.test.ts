import { test } from "node:test";
import assert from "node:assert/strict";
import { createRouter } from "./router";
test("previews sharing an id are retained while persisted records deduplicate", async () => {
 const route=createRouter(), seen:string[]=[];const sink=(kind:string)=>{seen.push(kind);};
 await route({type:"event_delta",id:"same"},sink);await route({type:"event_delta",id:"same"},sink);
 await route({type:"agent.message",id:"same"},sink);await route({type:"agent.message",id:"same"},sink);
 assert.deepEqual(seen,["preview","preview","text"]);
});
test("failed actions can be retried and usage has its own route", async () => {
 const route=createRouter();await assert.rejects(route({type:"agent.custom_tool_use",id:"one"},()=>{throw new Error("failed");}));
 let calls=0;await route({type:"agent.custom_tool_use",id:"one"},()=>{calls++;});await route({type:"span.model_request_end",id:"two"},kind=>assert.equal(kind,"usage"));assert.equal(calls,1);
});
