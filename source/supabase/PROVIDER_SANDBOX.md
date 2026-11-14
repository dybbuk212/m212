# M212 provider sandbox integrations
Configured targets: Openprovider, Namecheap, OVHcloud, Proxmox VE, CMI, Stripe, Resend; existing Plesk adapter retained.

## Safety
Every adapter connection test requires environment=sandbox. Stripe additionally requires an sk_test_ key. Worker allowlist: connection.test, domain.availability_check, account.read. No domain registration/transfer/renewal, VM creation, payment capture/refund, or email-send operation is implemented. Worker only loads credentials for sandbox provider records. No secrets in source, config JSON, CI, logs, or browser storage.

## Provider contracts
- Openprovider: sandbox host https://api.sandbox.openprovider.nl/v1beta; bearer auth followed by read-only domain availability probe.
- Namecheap: https://api.sandbox.namecheap.com/xml.response; requires API username, key, and whitelisted client IPv4.
- OVHcloud: regional API host; application key, application secret (Vault), consumer key; read-only GET /me probe.
- Proxmox: sandbox API endpoint and API token; GET /api2/json/version only.
- Stripe: sandbox/test key; GET /v1/account only.
- Resend: sandbox key; GET /domains only, never sends email.
- CMI: merchant-specific integration kit/test credentials are required. This adapter validates sandbox merchant configuration and endpoint only; it does not invent a universal health endpoint or initiate a payment. Implement hosted payment and callback signing only from the official merchant kit.

## Deploy
Review/apply migration, deploy provider-admin and provider-worker, set PROVIDER_WORKER_SECRET with Supabase secrets, then run Deno adapter tests. Configure separate sandbox accounts and run read-only connection checks. Do not enable production records.
