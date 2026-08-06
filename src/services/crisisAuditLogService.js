import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// Append-only per firestore.rules (crisisAuditLogs has no update/delete
// rule at all) — every admin moderation action on a crisis report, missing
// person case, or emergency resource writes one of these.
export async function logCrisisAdminAction(admin, { action, targetType, targetId, details }) {
  await addDoc(collection(db, "crisisAuditLogs"), {
    action,
    targetType,
    targetId,
    adminId: admin.uid,
    adminEmail: admin.email || "",
    details: details || "",
    createdAt: serverTimestamp(),
  });
}
