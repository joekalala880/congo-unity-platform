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

const REPORTS_COLLECTION = "crisisReports";
const ALERTS_COLLECTION = "publicCrisisAlerts";

function buildFieldPayload(fields) {
  return {
    category: fields.category || "",
    title: fields.title || "",
    description: fields.description || "",
    province: fields.province || "",
    territory: fields.territory || "",
    cityVillage: fields.cityVillage || "",
    approximateLocation: fields.approximateLocation || "",
    urgency: fields.urgency || "low",
    peopleAffectedCount: Number.isFinite(fields.peopleAffectedCount) ? fields.peopleAffectedCount : 0,
    preferredContactMethod: fields.preferredContactMethod || "",
    contactDetails: fields.contactDetails || "",
    photoUrl: fields.photoUrl || "",
    showIdentityPublicly: !!fields.showIdentityPublicly,
    showLocationPublicly: !!fields.showLocationPublicly,
  };
}

export async function createCrisisReport(user, fields, { submit } = {}) {
  const payload = {
    ...buildFieldPayload(fields),
    reporterId: user.uid,
    status: submit ? "submitted" : "draft",
    adminMessage: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, REPORTS_COLLECTION), payload);
  return ref.id;
}

export async function updateCrisisReportContent(reportId, fields, { submit } = {}) {
  const payload = {
    ...buildFieldPayload(fields),
    updatedAt: serverTimestamp(),
  };
  if (submit) payload.status = "submitted";
  await updateDoc(doc(db, REPORTS_COLLECTION, reportId), payload);
}

export async function getCrisisReport(reportId) {
  const snap = await getDoc(doc(db, REPORTS_COLLECTION, reportId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function listMyCrisisReports(uid) {
  const snapshot = await getDocs(query(collection(db, REPORTS_COLLECTION), where("reporterId", "==", uid)));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}

// ---------- Public alerts ----------

// No full-text search backend — public alerts are fetched once and
// filtered/sorted client-side, matching the pattern used across every other
// module in this app.
export async function listPublicCrisisAlerts() {
  const snapshot = await getDocs(collection(db, ALERTS_COLLECTION));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Publishes (or re-publishes) the public-safe copy of a verified report.
// Deterministic ID (== source report ID) keeps this idempotent and makes
// later status syncs (resolved/archived) trivial upserts.
//
// Location handling: province is always included (coarse — DRC has ~26
// provinces, not identifying on its own) so the public filters keep
// working even when the reporter withheld location permission. Territory
// and city/village — finer-grained — are only included when the reporter
// explicitly opted in via showLocationPublicly. The free-text
// approximateLocation note is never published, since it can contain
// identifying detail (e.g. "behind the church near my house").
export async function publishCrisisAlert(report, reporterDisplayName) {
  const payload = {
    category: report.category,
    title: report.title,
    description: report.description,
    province: report.province || "",
    territory: report.showLocationPublicly ? report.territory || "" : "",
    cityVillage: report.showLocationPublicly ? report.cityVillage || "" : "",
    urgency: report.urgency,
    peopleAffectedCount: report.peopleAffectedCount || 0,
    reporterDisplayName: report.showIdentityPublicly ? reporterDisplayName || "" : "",
    status: "verified",
    publishedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, ALERTS_COLLECTION, report.id), payload);
}

export async function updatePublicAlertStatus(reportId, status) {
  await updateDoc(doc(db, ALERTS_COLLECTION, reportId), { status, updatedAt: serverTimestamp() });
}
