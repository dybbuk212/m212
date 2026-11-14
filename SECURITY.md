# Security Policy

## Supported versions

Security fixes are developed against the default branch. Older releases may not receive security updates; deploy the latest reviewed release.

## Reporting a vulnerability

**Please do not report security vulnerabilities in public GitHub issues, pull requests, discussions, or social media.**

Use GitHub's **Report a vulnerability** feature on this repository (Security tab → Advisories → Report a vulnerability). Private vulnerability reporting is enabled for this repository.

If GitHub's private reporting flow is unavailable, contact the repository maintainers through a private channel associated with the project. Include:
- A concise description and impact assessment.
- Affected paths, versions, commits, and deployment configuration.
- Reproduction steps or a proof of concept that does not access real user data.
- Any suggested mitigation.

Do not include live credentials, personal data, or customer records in the report. Revoke and rotate any credential that may have been exposed.

## Response expectations

Maintainers will acknowledge a valid report as soon as reasonably possible, investigate privately, coordinate a fix and disclosure timeline with the reporter, and publish a security advisory when appropriate. Please allow maintainers time to remediate before public disclosure.

## Scope

The in-scope assets include the M212 application, API, Supabase migrations and Edge Functions, infrastructure automation, and deployment workflows maintained in this repository. Third-party services and infrastructure not controlled by the project are out of scope unless a vulnerability is caused by M212 integration code.
