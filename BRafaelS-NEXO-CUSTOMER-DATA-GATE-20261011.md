# ¿00002¿B — NEXO customer-data security checkpoint — 2026-10-11

Corporate copyright candidate: Bruno Rafael Silva Desenvolvimento de Software Ltda. (BRafaelS).

## Source risk found
In the publicly visible `main` before branch changes, `api/crm.js` GET returned full leads, dossiers, attached-file references and related messages without checking a credential. `api/leads.js` GET returned masked phone numbers but retained other lead properties, and `api/fila.js` GET returned tickets including name/contact details. These are potential personal-data disclosure issues when deployed at reachable endpoints. This is a **code exposure pathway**, not proof of unauthorized access in production.

## Branch-only remediation
Audit branch `audit/v0002c-20261010` requires a configured `ADMIN_PIN` and matching `x-admin-pin` header on all methods for each of the three handlers; absent or incorrect credential returns HTTP 401 before reading the customer-data store.

## Execution and verification
GitHub Actions **38139365265** `BRafaelS NEXO privacy endpoint qualification`: SUCCESS. Tested missing ADMIN_PIN and invalid PIN for GET/POST across three handlers. JavaScript syntax SUCCESS; historical secrets scan SUCCESS.

## Not a complete access-control solution
Shared static PIN/header is a temporary fail-closed measure and must not be embedded in public browser JavaScript. Need a proper authenticated server-side session, role-based authorization, rate limiting, audit logs, deployment secret configuration, and tests for admin UI. Other endpoints such as `api/whatsapp.js`, `api/kb.js`, and `api/lead.js` need separate threat review. Original `main` is untouched: **production is not protected by this audit-branch change**.

Decision: **BRANCH_DENY_DEFAULT_PASS / END_TO_END_AUTH_PENDING / MAIN_REMAINS_AT_RISK / OSS_RELEASE_HOLD**.
