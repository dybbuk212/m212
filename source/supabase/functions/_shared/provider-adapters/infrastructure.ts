import { validatePublicHttpsEndpoint, type ProviderAdapter, type ProviderConnection, type AdapterTestResult } from "./types.ts";
const result=(provider:string,ok:boolean,capabilities:string[],errorCode?:string):AdapterTestResult=>({ok,provider,checkedAt:new Date().toISOString(),capabilities,...(errorCode?{errorCode}:{})});
const get= (url:URL,headers:Record<string,string>)=>fetch(url,{headers,redirect:"error",signal:AbortSignal.timeout(10000)});
export const proxmoxAdapter:ProviderAdapter={
 category:"hypervisor",
 async test(c:ProviderConnection,secret:string){
  if(c.environment!=="sandbox") throw new Error("sandbox_environment_required");
  const base=await validatePublicHttpsEndpoint(c.endpoint_url);
  const tokenId=String(c.config.token_id??"");
  if(!tokenId||!secret) throw new Error("proxmox_api_token_missing");
  const response=await get(new URL("/api2/json/version",base),{Authorization:`PVEAPIToken=${c.username}!${tokenId}=${secret}`});
  return result("proxmox",response.ok,response.ok?["connection.test","cluster.version.read"]:[] ,response.ok?undefined:"proxmox_api_probe_failed");
 }
};
export const stripeAdapter:ProviderAdapter={
 category:"payment",
 async test(c:ProviderConnection,secret:string){
  if(c.environment!=="sandbox"||!secret.startsWith("sk_test_")) throw new Error("stripe_test_key_required");
  const base=await validatePublicHttpsEndpoint(c.endpoint_url||"https://api.stripe.com");
  const response=await get(new URL("/v1/account",base),{Authorization:`Bearer ${secret}`});
  return result("stripe",response.ok,response.ok?["connection.test","account.read"]:[],response.ok?undefined:"stripe_api_probe_failed");
 }
};
export const resendAdapter:ProviderAdapter={
 category:"email",
 async test(c:ProviderConnection,secret:string){
  if(c.environment!=="sandbox") throw new Error("sandbox_environment_required");
  const base=await validatePublicHttpsEndpoint(c.endpoint_url||"https://api.resend.com");
  if(!secret.startsWith("re_")) throw new Error("resend_api_key_invalid");
  const response=await get(new URL("/domains",base),{Authorization:`Bearer ${secret}`});
  return result("resend",response.ok,response.ok?["connection.test","domains.read"]:[],response.ok?undefined:"resend_api_probe_failed");
 }
};
export const cmiAdapter:ProviderAdapter={
 category:"payment",
 async test(c:ProviderConnection,secret:string){
  if(c.environment!=="sandbox") throw new Error("sandbox_environment_required");
  if(!secret||!c.account_reference||!c.endpoint_url) throw new Error("cmi_test_merchant_configuration_missing");
  const base=await validatePublicHttpsEndpoint(c.endpoint_url);
  if(!/test|sandbox/i.test(base.hostname)) throw new Error("cmi_sandbox_endpoint_required");
  // CMI supplies a merchant-specific integration kit and test credentials. Do not
  // invent a universal health endpoint or initiate a payment during a connection test.
  return result("cmi",true,["configuration.validated","hosted-payment-flow.requires-merchant-kit"]);
 }
};
