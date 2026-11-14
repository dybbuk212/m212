import { assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validatePublicHttpsEndpoint } from "./types.ts";

Deno.test("rejects HTTP endpoints", async () => {
  await assertRejects(() => validatePublicHttpsEndpoint("http://panel.example.com:8443"), Error, "provider_endpoint_https_required");
});

Deno.test("rejects localhost and private IPv4 endpoints before DNS lookup", async () => {
  for (const endpoint of ["https://localhost:8443", "https://127.0.0.1:8443", "https://10.0.0.2:8443", "https://192.168.1.2:8443", "https://172.16.0.1:8443"]) {
    await assertRejects(() => validatePublicHttpsEndpoint(endpoint), Error, "provider_endpoint_private_address_blocked");
  }
});

Deno.test("rejects embedded credentials and query strings", async () => {
  await assertRejects(() => validatePublicHttpsEndpoint("https://user:pass@panel.example.com"), Error, "provider_endpoint_https_required");
  await assertRejects(() => validatePublicHttpsEndpoint("https://panel.example.com/?token=x"), Error, "provider_endpoint_https_required");
});
