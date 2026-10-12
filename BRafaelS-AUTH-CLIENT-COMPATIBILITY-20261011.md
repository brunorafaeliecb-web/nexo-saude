# ¿00002¿B — Auth client compatibility checkpoint — 2026-10-11

Corporate holder indicated: Bruno Rafael Silva Desenvolvimento de Software Ltda. (BRafaelS).

## Confirmed
- Three high-risk endpoints (CRM, leads and queue) on audit branch fail closed without configured credentials.
- `BRafaelS NEXO valid-credential functional test`, run **38154050342**: SUCCESS. Valid nonproduction administrator credential allowed successful read-only GET for CRM, leads and queue; anonymous requests returned 401.
- `BRafaelS NEXO frontend access compatibility`, run **38153970836**: SUCCESS as detection/verification of known mismatch. Existing `crm.html` and `fila.html` call endpoints without the required authentication header, so audit branch controls would interrupt these UI workflows.
- `api/kb.js` mutation path separately fail-closed, confirmed by CI.

## Release gate
Static browser pages cannot safely contain `ADMIN_PIN`. Do not weaken the server guards or embed the credential in frontend JavaScript. Must implement server-side session-based admin authentication, separate public queue operations from privileged actions and test flows before merge or publication. Original main unchanged. Tests do not prove production integration.

Decision: **BACKEND_AUTHORIZED_AND_DENY_TESTS_PASS / FRONTEND_AUTH_INTEGRATION_HOLD / NO_MERGE**.
