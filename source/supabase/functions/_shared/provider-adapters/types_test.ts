import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validatePublicHttpsEndpoint } from "./types.ts";

Deno.test("accepts HTTPS Plesk endpoints", () => {
  const url = validatePublicHttpsEndpoint("https://panel.example.com:8443");
  assertEquals(url.hostname, "panel.example.com");
  assertEquals(url.port, "8443");
});

Deno.test("rejects HTTP endpoints", () => {
  assertThrows(() => validatePublicHttpsEndpoint("http://panel.example.com:8443"), Error, "provider_endpoint_https_required");
});

Deno.test("rejects localhost and private IPv4 endpoints", () => {
  for (const endpoint of ["https://localhost:8443", "https://127.0.0.1:8443", "https://10.0.0.2:8443", "https://192.168.1.2:8443", "https://172.16.0.1:8443"]) {
    assertThrows(() => validatePublicHttpsEndpoint(endpoint), Error, "provider_endpoint_private_address_blocked");
  }
});

Deno.test("rejects embedded credentials and query strings", () => {
  assertThrows(() => validatePublicHttpsEndpoint("https://user:pass@panel.example.com"), Error, "provider_endpoint_https_required");
  assertThrows(() => validatePublicHttpsEndpoint("https://panel.example.com/?token=x"), Error, "provider_endpoint_https_required");
});
