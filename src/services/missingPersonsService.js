import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "missingPersonReports";

// Public visibility is status-gated on this same document (no separate
// public collection), so nothing sensitive lives here: no reporter email or
// phone number, just reporterId (a bare uid, ownership checks only) and the
// safeContactMethod the reporter explicitly designated as OK to publish.
function buildFieldPayload(fields) {
  return {
    name: fields.name || "",
    photoUrl: fields.photoUrl || "",
    approximateAge: fields.approximateAge || "",
    gender: fields.gender || "Unknown",
    lastSeenDate: fields.lastSeenDate || "",
    lastSeenLocation: fields.lastSeenLocation || "",
    clothingDescription: fields.clothingDescription || "",
    distinguishingFeatures: fields.distinguishingFeatures || "",
    safeContactMethod: fields.safeContactMethod || "",
  };
}

export async function createMissingPersonReport(user, fields) {
  const payload = {
    ...buildFieldPayload(fields),
    reporterId: user.uid,
    status: "submitted",
    adminMessage: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COLLECTION), payload);
  return ref.id;
}

export async function updateMissingPersonContent(caseId, fields) {
  await updateDoc(doc(db, COLLECTION, caseId), {
    ...buildFieldPayload(fields),
    updatedAt: serverTimestamp(),
  });
}

export async function getMissingPersonReport(caseId) {
  const snap = await getDoc(doc(db, COLLECTION, caseId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function listMyMissingPersonReports(uid) {
  const snapshot = await getDocs(query(collection(db, COLLECTION), where("reporterId", "==", uid)));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}

// No full-text search backend — public cases are fetched once and
// filtered/sorted client-side, matching the pattern used across this app.
export async function listPublicMissingPersonCases() {
  const snapshot = await getDocs(
    query(collection(db, COLLECTION), where("status", "in", ["verified_missing", "located"]))
  );
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}
