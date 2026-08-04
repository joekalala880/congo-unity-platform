import { doc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { PRIMARY_ID_TYPES } from "./identityDocumentTypes";
import { logAuditEvent } from "./verificationAuditService";

// A profile only auto-verifies once it has one approved primary photo ID
// (national ID / passport / driver license / residence permit / refugee
// card) AND an approved selfie — see identityDocumentTypes.js for why this
// specific pair was chosen as the Phase 2 policy default.
export function hasRequiredApprovedDocuments(documents) {
  const approved = documents.filter((d) => d.status === "approved");
  const hasPrimaryId = approved.some((d) => PRIMARY_ID_TYPES.includes(d.documentType));
  const hasSelfie = approved.some((d) => d.documentType === "selfie");
  return hasPrimaryId && hasSelfie;
}

// Called after any document approval. Does nothing unless the citizen now
// has every required document approved and isn't already verified — never
// auto-verifies a profile with missing documents, and never re-runs the
// verification side effects (notification, audit entry) for someone
// already verified.
export async function maybeFinalizeVerification({ admin, profile, documents }) {
  if (profile.status === "verified") return false;
  if (!hasRequiredApprovedDocuments(documents)) return false;

  const verifiedAt = new Date();
  const batch = writeBatch(db);

  batch.update(doc(db, "congoleseProfiles", profile.id), {
    status: "verified",
    verifiedAt,
    verifiedBy: admin.uid,
  });

  if (profile.citizenId) {
    batch.update(doc(db, "publicVerifications", profile.citizenId), {
      status: "verified",
      verifiedAt,
      verifiedBy: admin.uid,
    });
  }

  await batch.commit();

  await logAuditEvent({
    type: "profile_verification_change",
    documentId: null,
    userId: profile.userId,
    actorId: admin.uid,
    actorRole: "admin",
    message: "Profile automatically verified — all required documents approved.",
  });

  return true;
}
