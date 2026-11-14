import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getProviderAdapter } from "../_shared/provider-adapters/registry.ts";
import type { ProviderCategory, ProviderConnection } from "../_shared/provider-adapters/types.ts";
Deno.serve(async (req) => {
 if(req.method!=="POST") return new Response("Method not allowed",{status:405});
 const expected=Deno.env.get("PROVIDER_WORKER_SECRET")??"", supplied=req.headers.get("x-provider-worker-secret")??"";
 if(!expected||!supplied||!constantTimeEqual(expected,supplied)) return new Response("Unauthorized",{status:401});
 const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!key) return new Response("Worker configuration incomplete",{status:503});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}),workerId=crypto.randomUUID();
 const {data:jobs,error}=await db.rpc("claim_provider_jobs",{p_worker:workerId,p_limit:10});
 if(error) return Response.json({error:"queue_claim_failed"},{status:500});
 let completed=0,failed=0;
 for(const job of jobs??[]) try {
  if(job.environment!=="sandbox"||!["connection.test","domain.availability_check","account.read"].includes(job.operation)) throw new Error("operation_not_allowed");
  const {data:c,error:ce}=await db.from("provider_connections").select("id,provider_key,category,environment,endpoint_url,account_reference,username,secret_id,config").eq("id",job.provider_connection_id).single();
  if(ce||!c||c.environment!=="sandbox") throw new Error("sandbox_connection_required");
  const adapter=getProviderAdapter(c.category as ProviderCategory,c.provider_key);
  if(!adapter||!c.secret_id) throw new Error("provider_adapter_or_secret_missing");
  const {data:secret,error:se}=await db.rpc("provider_get_secret",{p_secret_id:c.secret_id});
  if(se||typeof secret!=="string"||!secret) throw new Error("provider_secret_unavailable");
  const outcome=await adapter.test(c as ProviderConnection,secret);
  if(!outcome.ok) throw new Error(outcome.errorCode??"provider_test_failed");
  await db.from("provider_jobs").update({status:"succeeded",result:outcome,locked_at:null,locked_by:null,updated_at:new Date().toISOString()}).eq("id",job.id); completed++;
 } catch(e) {
  const code=e instanceof Error?e.message:"provider_job_failed";
  await db.from("provider_jobs").update({status:job.attempts>=5?"dead_letter":"queued",error_code:code,available_at:new Date(Date.now()+Math.min(3600,2**job.attempts*30)*1000).toISOString(),locked_at:null,locked_by:null,updated_at:new Date().toISOString()}).eq("id",job.id); failed++;
 }
 return Response.json({claimed:jobs?.length??0,completed,failed,workerId});
});
function constantTimeEqual(a:string,b:string){const x=new TextEncoder().encode(a),y=new TextEncoder().encode(b);let d=x.length^y.length;for(let i=0;i<Math.max(x.length,y.length);i++)d|=(x[i]??0)^(y[i]??0);return d===0;}
