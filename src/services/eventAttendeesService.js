import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { createNotification } from "./notificationService";

const COLLECTION = "eventAttendees";

export function attendeeIdFor(eventId, uid) {
  return `${eventId}_${uid}`;
}

export async function getMyRsvp(eventId, uid) {
  const snap = await getDoc(doc(db, COLLECTION, attendeeIdFor(eventId, uid)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function listMyRsvps(uid) {
  const snapshot = await getDocs(query(collection(db, COLLECTION), where("userId", "==", uid)));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listAttendeesForEvent(eventId) {
  const snapshot = await getDocs(query(collection(db, COLLECTION), where("eventId", "==", eventId)));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}

// Sets an RSVP to 'going' or 'interested'. A transaction (not separate
// calls) is what actually makes the capacity check race-safe: if two
// people RSVP for the last slot at once, Firestore detects the conflicting
// read on the event doc and retries one of them against the now-current
// goingCount, so the rules' capacity check on retry sees fresh data.
export async function setRsvp(user, event, status) {
  const attendeeRef = doc(db, COLLECTION, attendeeIdFor(event.id, user.uid));
  const eventRef = doc(db, "events", event.id);

  await runTransaction(db, async (tx) => {
    const eventSnap = await tx.get(eventRef);
    const existingSnap = await tx.get(attendeeRef);
    const eventData = eventSnap.data();
    const wasGoing = existingSnap.exists() && existingSnap.data().status === "going";

    if (status === "going" && !wasGoing && eventData.capacity > 0 && eventData.goingCount >= eventData.capacity) {
      throw new Error("This event is at full capacity.");
    }

    if (existingSnap.exists()) {
      tx.update(attendeeRef, { status, updatedAt: serverTimestamp() });
    } else {
      tx.set(attendeeRef, {
        eventId: event.id,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email,
        status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const goingDelta = (status === "going" ? 1 : 0) - (wasGoing ? 1 : 0);
    if (goingDelta !== 0) {
      tx.update(eventRef, { goingCount: increment(goingDelta), updatedAt: serverTimestamp() });
    }
  });

  if (status === "going") {
    await createNotification({
      to: user.email,
      from: "Congo Unity",
      fromUserId: user.uid,
      type: "RSVP Confirmed",
      message: `You're confirmed as Going to "${event.title}".`,
      relatedRoute: `/events/${event.id}`,
    });
  }
}

export async function cancelRsvp(user, event) {
  const attendeeRef = doc(db, COLLECTION, attendeeIdFor(event.id, user.uid));
  const eventRef = doc(db, "events", event.id);

  await runTransaction(db, async (tx) => {
    const existingSnap = await tx.get(attendeeRef);
    if (!existingSnap.exists()) return;

    const wasGoing = existingSnap.data().status === "going";
    tx.update(attendeeRef, { status: "cancelled", updatedAt: serverTimestamp() });

    if (wasGoing) {
      tx.update(eventRef, { goingCount: increment(-1), updatedAt: serverTimestamp() });
    }
  });
}
