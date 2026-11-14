import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getProviderAdapter } from "./registry.ts";
import type { ProviderConnection } from "./types.ts";
const conn=(key:string,category:ProviderConnection["category"],environment:"sandbox"|"production"="sandbox"):ProviderConnection=>({id:"00000000-0000-0000-0000-000000000001",provider_key:key,category,environment,endpoint_url:null,account_reference:"sandbox-account",username:"sandbox-user",secret_id:"vault-ref",config:{token_id:"sandbox-token"}});
Deno.test("all selected providers resolve to a concrete adapter",()=>{for(const [key,cat] of [["openprovider","registrar"],["namecheap","registrar"],["ovh","registrar"],["proxmox","hypervisor"],["cmi","payment"],["stripe","payment"],["resend","email"]] as const) assertEquals(getProviderAdapter(cat,key)?.category,cat);});
Deno.test("unknown vendor is rejected",()=>assertEquals(getProviderAdapter("registrar","unknown"),null));
Deno.test("every adapter rejects production environment",async()=>{for(const [key,cat] of [["openprovider","registrar"],["namecheap","registrar"],["ovh","registrar"],["proxmox","hypervisor"],["cmi","payment"],["stripe","payment"],["resend","email"]] as const) await assertRejects(()=>getProviderAdapter(cat,key)!.test(conn(key,cat,"production"),"test-secret"),Error,"sandbox_environment_required");});
