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
import { logApplicationAuditEvent } from "./serviceApplicationAuditService";

const COLLECTION = "serviceApplications";

// Owner-settable application fields — a union across all service types
// (each service's form only ever populates its own subset; the rest stay
// "" on that document). See the create/update rules in firestore.rules for
// the matching allowlists.
function buildFieldPayload(fields) {
  return {
    applicantFullName: fields.applicantFullName || "",
    dateOfBirth: fields.dateOfBirth || "",
    placeOfBirth: fields.placeOfBirth || "",
    provinceOfBirth: fields.provinceOfBirth || "",
    territoryOfBirth: fields.territoryOfBirth || "",
    fatherFullName: fields.fatherFullName || "",
    motherFullName: fields.motherFullName || "",
    reasonForRequest: fields.reasonForRequest || "",
    deliveryPreference: fields.deliveryPreference || "",
    passportType: fields.passportType || "",
    applicationMode: fields.applicationMode || "",
    currentPassportNumber: fields.currentPassportNumber || "",
    currentPassportIssueDate: fields.currentPassportIssueDate || "",
    currentPassportExpirationDate: fields.currentPassportExpirationDate || "",
    emergencyContactName: fields.emergencyContactName || "",
    emergencyContactPhone: fields.emergencyContactPhone || "",
    // Cloudinary publicId only — never a raw file or a permanently public
    // URL. uploadedAt is a plain client Date rather than serverTimestamp()
    // because Firestore doesn't allow server-timestamp sentinels inside
    // array elements.
    supportingDocuments: (fields.supportingDocuments || []).map((d) => ({
      documentType: d.documentType,
      cloudinaryPublicId: d.cloudinaryPublicId,
      resourceType: d.resourceType || "image",
      fileType: d.fileType,
      fileSize: d.fileSize,
      fileName: d.fileName || "",
      uploadedAt: d.uploadedAt || new Date(),
    })),
  };
}

export async function listMyApplications(uid) {
  const snapshot = await getDocs(query(collection(db, COLLECTION), where("applicantUserId", "==", uid)));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
}

export async function getApplication(applicationId) {
  const snap = await getDoc(doc(db, COLLECTION, applicationId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Starts a new application as a draft — nothing an admin needs to act on
// yet (status stays 'draft' until the citizen explicitly submits).
export async function createDraft(user, profile, serviceType, fields) {
  const payload = {
    applicantUserId: user.uid,
    applicantEmail: user.email,
    serviceType,
    citizenId: profile.citizenId,
    memberNumber: profile.memberNumber || "",
    ...buildFieldPayload(fields),
    status: "draft",
    submittedAt: null,
    reviewedAt: null,
    reviewedBy: null,
    reviewerId: null,
    rejectionReason: "",
    requestMoreInfoMessage: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, COLLECTION), payload);

  await logApplicationAuditEvent({
    type: "creation",
    applicationId: ref.id,
    userId: user.uid,
    actorId: user.uid,
    actorRole: "citizen",
    message: "Started a new application draft.",
  });

  return ref.id;
}

// Saves in-progress field edits without changing status — "Save Draft" /
// "Continue Later" and also used mid-review when responding to a
// more-information request (fields only; submitApplication() below is
// what actually moves status forward).
export async function saveDraftFields(applicationId, fields) {
  await updateDoc(doc(db, COLLECTION, applicationId), {
    ...buildFieldPayload(fields),
    updatedAt: serverTimestamp(),
  });
}

export async function submitApplication(user, applicationId, fields) {
  await updateDoc(doc(db, COLLECTION, applicationId), {
    ...buildFieldPayload(fields),
    status: "submitted",
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await logApplicationAuditEvent({
    type: "submission",
    applicationId,
    userId: user.uid,
    actorId: user.uid,
    actorRole: "citizen",
    message: "Submitted the application for review.",
  });
}

// Owner responds to an admin's "more information required" request by
// updating fields/documents and resubmitting — moves status back into the
// review queue.
export async function respondToMoreInfo(user, applicationId, fields) {
  await updateDoc(doc(db, COLLECTION, applicationId), {
    ...buildFieldPayload(fields),
    status: "submitted",
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await logApplicationAuditEvent({
    type: "submission",
    applicationId,
    userId: user.uid,
    actorId: user.uid,
    actorRole: "citizen",
    message: "Resubmitted after a request for more information.",
  });
}

// Only allowed while draft or submitted-but-not-yet-under-review —
// firestore.rules enforces this regardless of what's passed here.
export async function withdrawApplication(user, applicationId) {
  await updateDoc(doc(db, COLLECTION, applicationId), {
    status: "withdrawn",
    updatedAt: serverTimestamp(),
  });

  await logApplicationAuditEvent({
    type: "withdrawal",
    applicationId,
    userId: user.uid,
    actorId: user.uid,
    actorRole: "citizen",
    message: "Withdrew the application.",
  });
}
