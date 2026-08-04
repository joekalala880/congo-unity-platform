import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// Append-only audit trail for the identity verification workflow — see the
// verificationAuditLogs rules block in firestore.rules for why entries can
// never be edited or deleted once written. Readable by admins and by the
// citizen the entry is about (Identity Dashboard "recent activity"); never
// by anyone else.
//
// actorRole must match who's actually calling: 'citizen' entries can only
// be about the caller's own userId, 'admin' entries require the caller to
// actually be an admin — both enforced server-side by firestore.rules, not
// just here.
export async function logAuditEvent({ type, documentId = null, userId, actorId, actorRole, message = "" }) {
  try {
    await addDoc(collection(db, "verificationAuditLogs"), {
      type,
      documentId,
      userId,
      actorId,
      actorRole,
      message,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    // An audit-log write failing should never block the actual workflow
    // action (upload, review decision, etc) that triggered it.
    console.error(`Failed to log audit event (${type}):`, err);
  }
}
