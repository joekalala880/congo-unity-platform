# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Environment variables

Copy `.env.example` to `.env` and fill in your own values — `.env` is
git-ignored and should never be committed.

| Variable | Used for |
| --- | --- |
| `VITE_CLOUDINARY_CLOUD_NAME` | Profile photo uploads (Register / Edit Profile) — your Cloudinary cloud name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | An **unsigned** Cloudinary upload preset (Cloudinary dashboard → Settings → Upload → Upload presets) |

These are safe to expose in client-side code: the app only ever performs
unsigned Cloudinary uploads, so no Cloudinary API secret is used anywhere
in this repository.

## Identity document uploads

Identity documents (passport/voter card/national ID, uploaded from
`UploadID.jsx`) are **not** uploaded the same way as profile photos.
Profile photos are meant to be public, so an unsigned Cloudinary preset is
fine for them. ID documents are sensitive PII — an unsigned upload's
resulting URL is publicly viewable by anyone who ever obtains it, with no
expiry and no authentication, which isn't an acceptable exposure for a
passport scan. So this feature uploads documents as Cloudinary
`type: "authenticated"` assets, which Cloudinary won't serve without a
valid signature.

Generating that signature requires the Cloudinary **API secret**, which can
never live in frontend code. That's what `api/cloudinary-sign.js` is for —
a small serverless function (written for Vercel's Node.js runtime) that:

1. Verifies the caller's Firebase ID token (via `firebase-admin`) before
   doing anything.
2. `action: "upload"` — mints a per-request Cloudinary upload signature
   scoped to `identityDocuments/{uid}/`, `type: authenticated`. Only a
   signed-in user can get one, and only for their own uid.
3. `action: "view"` — checks the caller's `congoleseProfiles` document has
   `role: "admin"` (server-side, via Firestore Admin SDK — not just
   trusting the client), then returns a signed Cloudinary delivery URL for
   a given document.

### Deploying this function

The function lives in this repo's `api/` directory, which Vercel picks up
automatically if you deploy this project there (`vercel` CLI or the Vercel
dashboard, no extra config needed — it'll build the Vite frontend and the
`/api/cloudinary-sign` function together).

It needs these environment variables set **on Vercel**, not in `.env`
(these must never reach the browser):

| Variable | Used for |
| --- | --- |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary dashboard → Settings → API Keys |
| `CLOUDINARY_API_SECRET` | Same page — **never** put this in `VITE_`-prefixed vars or commit it |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | The full JSON from Firebase Console → Project Settings → Service Accounts → Generate new private key, as a single-line string |
| `CLOUDINARY_DELIVERY_TOKEN_KEY` | Optional. Cloudinary dashboard → Settings → Security → Strict token authentication. If set, admin "view" URLs expire after 10 minutes instead of staying valid indefinitely. |

Once deployed, set `VITE_ID_DOCUMENT_SIGNING_ENDPOINT` (in your `.env`, and
in whatever hosts the frontend) to that function's URL, e.g.
`https://your-app.vercel.app/api/cloudinary-sign`.

The `"view"` action is called from `/admin/verifications`' "View Document"
button.

## Account suspension — current limits and a proposed fix

`/admin/users` can "suspend" an account, and `ProtectedRoute`/`ProtectedAdmin`
block a suspended user from every route they gate, redirecting to
`/account-suspended`. **This is an app-level status flag, not a true Firebase
Auth account lock.** A suspended user's email/password still work — Firebase
Auth itself has no idea they've been suspended. Only this app's own checks
(`useAccountStatus`, read on every protected-route render) treat them as
restricted. If you called Firebase's REST/Admin APIs directly, or a future
feature forgot to route through `ProtectedRoute`, that boundary wouldn't
apply.

Actually disabling sign-in requires the **Admin SDK** (`admin.auth().updateUser(uid, { disabled: true })`),
which — like the Cloudinary signing endpoint above — can only run
server-side, never in the browser. This isn't built. A proposed design,
following the same pattern as `api/cloudinary-sign.js`:

1. A new serverless function, e.g. `api/admin-suspend-user.js`, verifying
   the caller's Firebase ID token and that their own profile has
   `role: "admin"` (same pattern as the `"view"` action).
2. On suspend: call `admin.auth().updateUser(targetUid, { disabled: true })`,
   then write `status: "suspended"` to Firestore (so the existing UI/rules
   layer stays in sync) — Firebase Auth would then reject the user's
   *existing* session token on next refresh and block any new sign-in
   attempt outright, not just app-level routes.
3. On reactivate: `admin.auth().updateUser(targetUid, { disabled: false })`,
   then restore the Firestore status.
4. Reuses the same `FIREBASE_SERVICE_ACCOUNT_KEY` env var already required
   for `api/cloudinary-sign.js` — no new secret needed, just a new function
   and a call to it from `/admin/users`' suspend/reactivate buttons.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
