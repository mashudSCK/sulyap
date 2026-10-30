# Admin access

Set ADMIN_USERNAME (defaults to admin) and ADMIN_PASSWORD in the hosting platform's environment settings. ADMIN_PASSWORD must be at least 16 characters; generate a unique random password and do not commit it. With missing/short credentials, admin login returns 503 while anonymous chat remains available. The previous default password is removed.

Successful login returns an opaque bearer token and expiresAt (milliseconds since Unix epoch). The existing dashboard sends this token in its HTTP Authorization header and Socket.IO auth.token field. All /api/admin handlers after login require a valid session, and admin=true socket connections must authenticate before joining the private admin room. Admin activity/feedback events are restricted to that room; online-count and anonymous chat events remain public.

Sessions expire after one hour, and admin sockets disconnect at that time. Log in again when expired. Sessions are stored in process memory and are invalidated by a backend restart. This matches the existing single-process chat/feedback architecture; multiple replicas would require a shared session store. At most 1,000 sessions are retained, evicting the oldest when full.

Login is limited to 20 attempts per minute across this process, including successful attempts. This bounded global budget can temporarily block legitimate logins during an attack; add a trusted gateway's per-client controls if needed. Never trust arbitrary forwarded IP headers to bypass that control.

Deploy using HTTPS. Existing stored dashboard tokens will stop working; log in again after deployment. This change does not deploy itself or rotate any hosting credentials.

## Regression tests

Use Node 18+ for the test runner and built-in fetch. From backend/, install dependencies and run npm test. Tests use local child processes and random test credentials; they never contact a live deployment. They cover unauthenticated/forged HTTP access, valid login, socket admin impersonation, event isolation, session expiration/storage bounds, login throttling, missing credentials, and anonymous chat pairing/message delivery.
