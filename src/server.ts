import { serveStudentAsset } from "./student-assets";
import http from "node:http";
import {readFile} from "node:fs/promises";
import {existsSync} from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import {createRouter, type RoutedEvent} from "./router";
if(existsSync(".env"))process.loadEnvFile(".env");
const port=Number(process.env.PORT||3008),key=process.env.ANTHROPIC_API_KEY||"",agent=process.env.CLAUDE_MANAGED_AGENT_ID||"",environment=process.env.CLAUDE_MANAGED_ENVIRONMENT_ID||"";
const configured=[key,agent,environment].every(v=>v&&!v.startsWith("your_"));
http.createServer(async(req,res)=>{res.setHeader("Cache-Control","no-store");try {
    if (await serveStudentAsset(req, res)) return;
 if(req.method==="GET"&&req.url==="/api/config"){res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify({configured}));return;}
 if(req.method==="POST"&&req.url==="/api/run"){
  const origin=req.headers.origin;if(origin&&origin!==`http://127.0.0.1:${port}`&&origin!==`http://localhost:${port}`){res.writeHead(403).end();return;}
  let raw="";for await(const chunk of req){raw+=chunk;if(raw.length>10000)throw new Error("Request too large");}const body=JSON.parse(raw||"{}");if(typeof body.prompt!=="string"||!body.prompt.trim()||body.prompt.length>2000)throw new Error("Enter a prompt of up to 2,000 characters.");if(!configured)throw new Error("Configure the API key and IDs in .env.");
  res.writeHead(200,{"Content-Type":"application/x-ndjson; charset=utf-8"});const send=(type:string,value:unknown)=>{if(!res.destroyed)res.write(JSON.stringify({type,value})+"\n");};
  try{const client=new Anthropic({apiKey:key}),session=await client.beta.sessions.create({agent,environment_id:environment,budget:{type:"limit",max_list_cost:{amount:"50",currency:"USD"}}});send("session",session.id);
   const stream=await client.beta.sessions.events.stream(session.id);res.on("close",()=>stream.controller.abort());await client.beta.sessions.events.send(session.id,{events:[{type:"user.message",content:[{type:"text",text:body.prompt.trim()}]}]});const route=createRouter();
   for await(const event of stream){await route(event as unknown as RoutedEvent,(sink,e)=>send("route",{sink,event:e}));if(event.type==="session.status_idle"){send("stop",event.stop_reason.type);break;}if(event.type==="session.status_terminated"){send("stop","terminated");break;}if(event.type==="session.error"){send("error","Provider reported a session error.");break;}}
  }catch(error){send("error",error instanceof Error?error.message:"Run failed");}res.end();return;
 }
 const files:Record<string,string>={"/":"index.html","/style.css":"style.css","/app.js":"app.js","/astronaut.png":"astronaut.png"};if(req.method==="GET"&&req.url&&files[req.url]){const f=files[req.url],data=await readFile(path.join(__dirname,"..","public",f));res.writeHead(200,{"Content-Type":f.endsWith(".png")?"image/png":f.endsWith(".css")?"text/css":f.endsWith(".js")?"text/javascript":"text/html; charset=utf-8"});res.end(data);return;}res.writeHead(404).end("Not found");
}catch(error){if(!res.headersSent)res.writeHead(400,{"Content-Type":"application/json"});res.end(JSON.stringify({error:error instanceof Error?error.message:"Request failed"}));}}).listen(port,"127.0.0.1",()=>console.log(`Open http://127.0.0.1:${port}`));
