import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "events";

function buildFieldPayload(fields) {
  return {
    title: fields.title || "",
    description: fields.description || "",
    category: fields.category || "",
    organizerName: fields.organizerName || "",
    date: fields.date || "",
    startTime: fields.startTime || "",
    endTime: fields.endTime || "",
    timeZone: fields.timeZone || "",
    onlineOrInPerson: fields.onlineOrInPerson || "in_person",
    venueName: fields.venueName || "",
    address: fields.address || "",
    city: fields.city || "",
    country: fields.country || "",
    capacity: Number(fields.capacity) || 0,
    freeOrPaid: fields.freeOrPaid || "free",
    registrationLink: fields.registrationLink || "",
    imageUrl: fields.imageUrl || "",
    contactInformation: fields.contactInformation || "",
    accessibilityInformation: fields.accessibilityInformation || "",
  };
}

export async function createEvent(user, fields, { submitForApproval } = {}) {
  const payload = {
    ...buildFieldPayload(fields),
    createdBy: user.uid,
    createdByEmail: user.email,
    status: submitForApproval ? "pending_approval" : "draft",
    rejectionReason: "",
    featured: false,
    goingCount: 0,
    registrationClosed: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, COLLECTION), payload);

  if (fields.meetingLink) {
    await setDoc(doc(db, COLLECTION, ref.id, "organizerInfo", "details"), {
      meetingLink: fields.meetingLink,
    });
  }

  return ref.id;
}

export async function updateEventContent(eventId, fields) {
  await updateDoc(doc(db, COLLECTION, eventId), {
    ...buildFieldPayload(fields),
    updatedAt: serverTimestamp(),
  });

  if (fields.meetingLink !== undefined) {
    await setDoc(doc(db, COLLECTION, eventId, "organizerInfo", "details"), {
      meetingLink: fields.meetingLink,
    });
  }
}

export async function submitForApproval(eventId) {
  await updateDoc(doc(db, COLLECTION, eventId), {
    status: "pending_approval",
    updatedAt: serverTimestamp(),
  });
}

export async function cancelEvent(eventId) {
  await updateDoc(doc(db, COLLECTION, eventId), {
    status: "cancelled",
    updatedAt: serverTimestamp(),
  });
}

export async function closeRegistration(eventId, closed = true) {
  await updateDoc(doc(db, COLLECTION, eventId), {
    registrationClosed: closed,
    updatedAt: serverTimestamp(),
  });
}

export async function getEvent(eventId) {
  const snap = await getDoc(doc(db, COLLECTION, eventId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getMeetingLink(eventId) {
  try {
    const snap = await getDoc(doc(db, COLLECTION, eventId, "organizerInfo", "details"));
    return snap.exists() ? snap.data().meetingLink || "" : "";
  } catch {
    return "";
  }
}

// No full-text search backend — published/completed events are fetched
// once and filtered/searched client-side, the same pattern used for jobs
// and member search elsewhere in this app.
export async function listPublishedEvents() {
  const snapshot = await getDocs(
    query(collection(db, COLLECTION), where("status", "in", ["published", "completed"]))
  );
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
}

export async function listMyHostedEvents(uid) {
  const snapshot = await getDocs(query(collection(db, COLLECTION), where("createdBy", "==", uid)));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}
