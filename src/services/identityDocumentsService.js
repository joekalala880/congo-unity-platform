import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { logAuditEvent } from "./verificationAuditService";

const COLLECTION = "identityDocuments";

// Owner-settable fields when creating a submission — see the create rule in
// firestore.rules for the matching allowlist/validation.
function buildDocPayload(user, profile, fields, status) {
  return {
    userId: user.uid,
    citizenId: profile.citizenId,
    email: user.email,
    documentType: fields.documentType,
    documentNumber: fields.documentNumber || "",
    issuingCountry: fields.issuingCountry || "",
    issueDate: fields.issueDate || "",
    expirationDate: fields.expirationDate || "",
    cloudinaryPublicId: fields.cloudinaryPublicId,
    resourceType: fields.resourceType || "image",
    fileType: fields.fileType,
    fileSize: fields.fileSize,
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status,
    rejectionReason: "",
    requestMoreInfoMessage: "",
    reviewerId: null,
    reviewedAt: null,
  };
}

export async function listMyDocuments(uid) {
  const snapshot = await getDocs(query(collection(db, COLLECTION), where("userId", "==", uid)));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.submittedAt?.toMillis?.() || 0) - (a.submittedAt?.toMillis?.() || 0));
}

// Saves a new submission as a draft — not yet visible to admins as
// something needing review (it's still status: 'draft').
export async function saveDraft(user, profile, fields) {
  const payload = buildDocPayload(user, profile, fields, "draft");
  const ref = await addDoc(collection(db, COLLECTION), payload);

  await logAuditEvent({
    type: "upload",
    documentId: ref.id,
    userId: user.uid,
    actorId: user.uid,
    actorRole: "citizen",
    message: `Uploaded a ${fields.documentType} as a draft.`,
  });

  return ref.id;
}

// Saves a new submission and immediately submits it for review, skipping
// the draft state.
export async function submitNewDocument(user, profile, fields) {
  const payload = buildDocPayload(user, profile, fields, "submitted");
  const ref = await addDoc(collection(db, COLLECTION), payload);

  await logAuditEvent({
    type: "submission",
    documentId: ref.id,
    userId: user.uid,
    actorId: user.uid,
    actorRole: "citizen",
    message: `Submitted a ${fields.documentType} for verification.`,
  });

  return ref.id;
}

// Updates an existing draft's fields/file without changing its status.
export async function updateDraft(docId, fields) {
  await updateDoc(doc(db, COLLECTION, docId), {
    documentType: fields.documentType,
    documentNumber: fields.documentNumber || "",
    issuingCountry: fields.issuingCountry || "",
    issueDate: fields.issueDate || "",
    expirationDate: fields.expirationDate || "",
    cloudinaryPublicId: fields.cloudinaryPublicId,
    resourceType: fields.resourceType || "image",
    fileType: fields.fileType,
    fileSize: fields.fileSize,
    updatedAt: serverTimestamp(),
  });
}

// Moves a draft into the review queue.
export async function submitDraft(user, docId, documentType) {
  await updateDoc(doc(db, COLLECTION, docId), {
    status: "submitted",
    updatedAt: serverTimestamp(),
  });

  await logAuditEvent({
    type: "submission",
    documentId: docId,
    userId: user.uid,
    actorId: user.uid,
    actorRole: "citizen",
    message: `Submitted a ${documentType} for verification.`,
  });
}

// Owner responds to an admin's "more information required" request without
// replacing the underlying file — moves the document back into the queue.
export async function respondToMoreInfo(user, docId, responseMessage) {
  await updateDoc(doc(db, COLLECTION, docId), {
    status: "submitted",
    ownerResponseMessage: responseMessage,
    updatedAt: serverTimestamp(),
  });

  await logAuditEvent({
    type: "submission",
    documentId: docId,
    userId: user.uid,
    actorId: user.uid,
    actorRole: "citizen",
    message: "Responded to a request for more information.",
  });
}

// Replaces a rejected or more-information-required document with a newly
// uploaded file, preserving the original as history (status: 'replaced'
// rather than deleted). Both writes happen in one batch so a failure never
// leaves an orphaned "replaced" original with no successor, or vice versa.
export async function replaceDocument(user, profile, oldDocId, fields) {
  const batch = writeBatch(db);

  const newRef = doc(collection(db, COLLECTION));
  batch.set(newRef, {
    ...buildDocPayload(user, profile, fields, "submitted"),
    replacesDocumentId: oldDocId,
  });

  batch.update(doc(db, COLLECTION, oldDocId), {
    status: "replaced",
    updatedAt: serverTimestamp(),
  });

  await batch.commit();

  await logAuditEvent({
    type: "document_replacement",
    documentId: newRef.id,
    userId: user.uid,
    actorId: user.uid,
    actorRole: "citizen",
    message: `Replaced document ${oldDocId} with a new ${fields.documentType}.`,
  });

  return newRef.id;
}

// Only a draft (never submitted) can be deleted — enforced by
// firestore.rules regardless of what's passed here.
export async function deleteDraft(user, docId, documentType) {
  await deleteDoc(doc(db, COLLECTION, docId));

  await logAuditEvent({
    type: "deletion",
    documentId: docId,
    userId: user.uid,
    actorId: user.uid,
    actorRole: "citizen",
    message: `Deleted a draft ${documentType}.`,
  });
}
