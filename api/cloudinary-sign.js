import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { v2 as cloudinary } from "cloudinary";

// Vercel serverless function (Node runtime). Deployed alongside the Vite
// frontend at /api/cloudinary-sign. Holds the Cloudinary API secret and a
// Firebase service account credential — neither of these, nor this file's
// logic, is ever shipped to the browser.
//
// Identity documents are uploaded to Cloudinary with type: "authenticated",
// which Cloudinary will not serve without a valid signature — unlike the
// unsigned preset used for profile photos, a leaked identity-document URL
// is useless on its own. This function is the only thing that can produce
// (a) a signature that authorizes an upload, or (b) a signed URL that
// authorizes viewing an already-uploaded document, and it only does either
// after verifying the caller's Firebase session and (for viewing) that
// their profile has the admin role.

function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

  return initializeApp({ credential: cert(serviceAccount) });
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export default async function handler(req, res) {
  // Allows the frontend to call this function even when it isn't deployed
  // on the same origin as the Vite app (e.g. local dev against a deployed
  // function). Only this endpoint's own auth/role checks gate what a caller
  // can actually do, so an open CORS policy here doesn't widen access.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET ||
    !process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ) {
    res.status(500).json({ error: "Document upload isn't configured on the server yet." });
    return;
  }

  const authHeader = req.headers.authorization || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!idToken) {
    res.status(401).json({ error: "Missing Authorization header." });
    return;
  }

  const app = getAdminApp();

  let decodedToken;
  try {
    decodedToken = await getAuth(app).verifyIdToken(idToken);
  } catch {
    res.status(401).json({ error: "Your session has expired. Please sign in again." });
    return;
  }

  configureCloudinary();

  const { action } = req.body || {};

  if (action === "upload") {
    const timestamp = Math.floor(Date.now() / 1000);

    // Whitelisted service->folder mapping, not a client-supplied path —
    // keeps identity documents and government-service application
    // documents organized separately in Cloudinary without letting a
    // caller write anywhere outside their own uid-scoped folder tree.
    // Unrecognized/omitted service falls back to the original identity
    // folder, so existing callers (UploadID.jsx) need no changes.
    const FOLDER_BY_SERVICE = {
      identity: `identityDocuments/${decodedToken.uid}`,
      birthCertificate: `serviceApplications/${decodedToken.uid}/birthCertificate`,
      passport: `serviceApplications/${decodedToken.uid}/passport`,
    };
    const { service } = req.body || {};
    const folder = FOLDER_BY_SERVICE[service] || FOLDER_BY_SERVICE.identity;
    const type = "authenticated";

    const signature = cloudinary.utils.api_sign_request(
      { folder, timestamp, type },
      process.env.CLOUDINARY_API_SECRET
    );

    res.status(200).json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      folder,
      type,
      signature,
    });
    return;
  }

  if (action === "view") {
    const { publicId, resourceType } = req.body || {};

    if (!publicId || !resourceType) {
      res.status(400).json({ error: "publicId and resourceType are required." });
      return;
    }

    // Doc-ID lookup, matching firestore.rules' isAdmin() helper and the
    // client-side useIsAdmin hook exactly (see useIsAdmin.js for why a
    // where("userId","==",uid) query here could disagree with what the
    // rules — and this endpoint — actually treat as "admin").
    const db = getFirestore(app);
    const profileSnap = await db.collection("congoleseProfiles").doc(decodedToken.uid).get();

    const isAdmin = profileSnap.exists && profileSnap.data().role === "admin";

    if (!isAdmin) {
      res.status(403).json({ error: "Admin access required." });
      return;
    }

    // Without CLOUDINARY_DELIVERY_TOKEN_KEY (Cloudinary Console > Settings >
    // Security > Strict token authentication), this URL is signed but does
    // not expire — it stays admin-gated by virtue of never being handed out
    // except through this authorization check, but a leaked copy of the URL
    // itself would remain valid. Setting that key enables real short-lived
    // (10 minute) expiry via Cloudinary's token-based authentication.
    const urlOptions = {
      resource_type: resourceType,
      type: "authenticated",
      sign_url: true,
      secure: true,
    };

    if (process.env.CLOUDINARY_DELIVERY_TOKEN_KEY) {
      urlOptions.auth_token = {
        key: process.env.CLOUDINARY_DELIVERY_TOKEN_KEY,
        duration: 600,
      };
    }

    const url = cloudinary.url(publicId, urlOptions);

    res.status(200).json({ url });
    return;
  }

  res.status(400).json({ error: "Unknown action." });
}
