import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// Append-only audit trail for government service applications — see the
// serviceApplicationAuditLogs rules block in firestore.rules for why
// entries can never be edited or deleted, and why they're readable by
// admins and by the citizen the entry is about, never anyone else.
export async function logApplicationAuditEvent({ type, applicationId, userId, actorId, actorRole, message = "" }) {
  try {
    await addDoc(collection(db, "serviceApplicationAuditLogs"), {
      type,
      applicationId,
      userId,
      actorId,
      actorRole,
      message,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    // An audit-log write failing should never block the actual workflow
    // action (submission, review decision, etc) that triggered it.
    console.error(`Failed to log service application audit event (${type}):`, err);
  }
}
