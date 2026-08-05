import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// Thin, validated wrapper around notification creation — matches the
// allowlist/type-whitelist enforced in firestore.rules. Used for the two
// self-service notification types a regular user can trigger themselves
// (a new message, a new follower); admin-triggered notifications (identity
// verification, service application review) write directly since they're
// gated by isAdmin() instead and predate this helper.
export async function createNotification({ to, from, fromUserId, type, message, relatedRoute }) {
  await addDoc(collection(db, "notifications"), {
    to,
    from,
    fromUserId,
    type,
    message,
    relatedRoute: relatedRoute || "",
    read: false,
    createdAt: serverTimestamp(),
  });
}
