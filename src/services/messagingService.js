import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { createNotification } from "./notificationService";

export function conversationIdFor(uidA, uidB) {
  return [uidA, uidB].sort().join("_");
}

// Atomically fetches the conversation between two users, creating it first
// if it doesn't exist yet. The deterministic ID plus a transaction (rather
// than a plain getDoc-then-set) is what actually prevents a duplicate
// conversation record under a race — e.g. both people opening a DM to each
// other at the same moment.
export async function getOrCreateConversation(currentUser, otherUid) {
  if (otherUid === currentUser.uid) {
    throw new Error("You can't start a conversation with yourself.");
  }

  const conversationId = conversationIdFor(currentUser.uid, otherUid);
  const ref = doc(db, "conversations", conversationId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) return;

    tx.set(ref, {
      participants: [currentUser.uid, otherUid].sort(),
      lastMessage: null,
      unreadCount: { [currentUser.uid]: 0, [otherUid]: 0 },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  return conversationId;
}

export function listenToConversations(uid, onChange, onError) {
  const q = query(collection(db, "conversations"), where("participants", "array-contains", uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const conversations = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
      onChange(conversations);
    },
    onError
  );
}

export function listenToMessages(conversationId, onChange, onError) {
  const q = query(
    collection(db, "messages"),
    where("conversationId", "==", conversationId),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

export async function sendMessage({ conversationId, sender, senderName, recipientId, recipientEmail, text }) {
  const trimmed = text.trim();
  if (!trimmed) return;

  await addDoc(collection(db, "messages"), {
    conversationId,
    senderId: sender.uid,
    recipientId,
    text: trimmed,
    read: false,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "conversations", conversationId), {
    lastMessage: { text: trimmed, senderId: sender.uid, createdAt: new Date() },
    [`unreadCount.${recipientId}`]: increment(1),
    updatedAt: serverTimestamp(),
  });

  const displayName = senderName || sender.email;
  await createNotification({
    to: recipientEmail,
    from: displayName,
    fromUserId: sender.uid,
    type: "New Message",
    message: `New message from ${displayName}: "${trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed}"`,
    relatedRoute: `/direct-messages?with=${sender.uid}`,
  });
}

// Marks every unread message addressed to `uid` in this conversation as
// read, and zeroes their unread counter on the conversation doc — one
// batch so the two stay consistent with each other.
export async function markConversationRead(conversationId, uid) {
  const unreadSnap = await getDocs(
    query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      where("recipientId", "==", uid),
      where("read", "==", false)
    )
  );

  if (unreadSnap.empty) return;

  const batch = writeBatch(db);
  unreadSnap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  batch.update(doc(db, "conversations", conversationId), {
    [`unreadCount.${uid}`]: 0,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}
