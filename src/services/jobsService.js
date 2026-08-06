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

const COLLECTION = "jobs";

export async function createJob(user, fields) {
  const payload = {
    employerId: user.uid,
    employerEmail: user.email,
    companyName: fields.companyName || "",
    title: fields.title || "",
    description: fields.description || "",
    category: fields.category || "",
    type: fields.type || "",
    locationType: fields.locationType || "",
    location: fields.location || "",
    experienceLevel: fields.experienceLevel || "",
    salaryRange: fields.salaryRange || "",
    status: "pending_approval",
    rejectionReason: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    closedAt: null,
  };

  const ref = await addDoc(collection(db, COLLECTION), payload);
  return ref.id;
}

// Owner-editable content fields only — status transitions (close) go
// through closeJob() instead, matching the update rule's separate
// affectedKeys allowlist reasoning.
export async function updateJobContent(jobId, fields) {
  await updateDoc(doc(db, COLLECTION, jobId), {
    title: fields.title || "",
    description: fields.description || "",
    category: fields.category || "",
    type: fields.type || "",
    locationType: fields.locationType || "",
    location: fields.location || "",
    experienceLevel: fields.experienceLevel || "",
    salaryRange: fields.salaryRange || "",
    updatedAt: serverTimestamp(),
  });
}

export async function closeJob(jobId) {
  await updateDoc(doc(db, COLLECTION, jobId), {
    status: "closed",
    closedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getJob(jobId) {
  const snap = await getDoc(doc(db, COLLECTION, jobId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Firestore has no full-text search, so published jobs are fetched once and
// filtered/searched client-side — the same pattern SearchUsers.jsx already
// uses for member search. Fine at this collection's expected scale.
export async function listPublishedJobs() {
  const snapshot = await getDocs(query(collection(db, COLLECTION), where("status", "==", "published")));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}

export async function listMyPostedJobs(employerId) {
  const snapshot = await getDocs(query(collection(db, COLLECTION), where("employerId", "==", employerId)));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}
