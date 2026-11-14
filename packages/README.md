# Shared packages

Packages are framework-light, independently testable modules consumed by applications.

Planned packages:
- `contracts`: Zod/API/event contracts.
- `domain`: entities, value objects and business policies.
- `database`: generated Supabase database types and typed query helpers.
- `integrations`: provider ports and server-side adapters.
- `config`: shared TypeScript, lint and test configuration.
- `observability`: structured logging, tracing and metrics interfaces.

Keep dependency direction one-way: applications depend on packages; domain and contracts do not depend on apps or provider SDKs.
