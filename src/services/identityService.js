import { doc, runTransaction, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";

const COUNTER_DOC = doc(db, "counters", "citizenId");

function formatCitizenId(sequence) {
  const year = new Date().getFullYear();
  return `CD-${year}-${String(sequence).padStart(6, "0")}`;
}

function formatMemberNumber(sequence) {
  return `CU-${String(sequence).padStart(6, "0")}`;
}

// Runs once per user, the first time their profile is missing a
// citizenId — see useIdentity.js for where this gets called from. Safe
// to call multiple times / from multiple tabs: the transaction either
// creates counters/citizenId at 1 (the very first call across the whole
// platform) or atomically increments it, so two concurrent calls can
// never receive the same sequence number. firestore.rules separately
// makes citizenId/memberNumber/registrationDate write-once on
// congoleseProfiles, but this also short-circuits locally first so a
// profile that already has an identity never burns a sequence number
// it won't use.
//
// registrationDate intentionally mirrors the profile's actual signup
// date (createdAt), not "whenever this ran" — for a user who registered
// before this feature existed, that backfill could happen much later.
export async function generateCitizenIdentity(profileDocId, existingProfile) {
  if (existingProfile?.citizenId) {
    return {
      citizenId: existingProfile.citizenId,
      memberNumber: existingProfile.memberNumber,
      registrationDate: existingProfile.registrationDate,
    };
  }

  const sequence = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(COUNTER_DOC);

    if (!counterSnap.exists()) {
      transaction.set(COUNTER_DOC, { value: 1 });
      return 1;
    }

    const next = counterSnap.data().value + 1;
    transaction.update(COUNTER_DOC, { value: next });
    return next;
  });

  const citizenId = formatCitizenId(sequence);
  const memberNumber = formatMemberNumber(sequence);
  const registrationDate = existingProfile?.createdAt || new Date();

  // The publicVerifications mirror is created in the same batch as the
  // profile update: /verify/:citizenId (Phase 2) reads only this
  // public-safe document, never congoleseProfiles directly, since Firestore
  // rules can't redact individual fields from a document read.
  const batch = writeBatch(db);

  batch.update(doc(db, "congoleseProfiles", profileDocId), {
    citizenId,
    memberNumber,
    registrationDate,
  });

  batch.set(doc(db, "publicVerifications", citizenId), {
    userId: existingProfile.userId,
    citizenId,
    firstName: existingProfile.firstName || "",
    lastName: existingProfile.lastName || "",
    preferredName: existingProfile.preferredName || "",
    profileImageUrl: existingProfile.profileImageUrl || "",
    status: existingProfile.status || "pending_verification",
    registrationDate,
    verifiedAt: null,
    verifiedBy: null,
    province: existingProfile.province || "",
    currentCountry: existingProfile.currentCountry || "",
  });

  await batch.commit();

  return { citizenId, memberNumber, registrationDate };
}

// /verify/:citizenId reads only this public-safe document — see the
// publicVerifications rules block in firestore.rules for why a mirror
// collection exists at all instead of reading congoleseProfiles directly.
export function getVerificationUrl(citizenId) {
  return `${window.location.origin}/verify/${citizenId}`;
}

// Keeps the public mirror's display fields (name/photo/province/country)
// current after an EditProfile.jsx save. Owner-writable per
// firestore.rules, but only for exactly these fields — status/verifiedAt/
// verifiedBy stay admin-only, and nothing else from the private profile
// (email, phone, DOB, exact address) is ever mirrored here.
export async function syncPublicVerificationDisplayFields(
  citizenId,
  { firstName, lastName, preferredName, profileImageUrl, province, currentCountry }
) {
  await updateDoc(doc(db, "publicVerifications", citizenId), {
    firstName: firstName || "",
    lastName: lastName || "",
    preferredName: preferredName || "",
    profileImageUrl: profileImageUrl || "",
    province: province || "",
    currentCountry: currentCountry || "",
  });
}

// Keeps the public mirror's status in sync whenever an admin changes a
// profile's verification status directly (approve/reject/suspend/reactivate
// in AdminUserManagement.jsx, suspend in AdminVerificationQueue.jsx) —
// separate from maybeFinalizeVerification()'s own auto-verify path in
// verificationService.js, which already updates both documents in one
// batch. Without this, /verify/:citizenId could keep showing a citizen as
// "verified" after their account was suspended or rejected. No-ops if the
// profile has no citizenId yet (nothing to sync).
export async function syncPublicVerificationStatus(citizenId, { status, verifiedAt = null, verifiedBy = null }) {
  if (!citizenId) return;
  await updateDoc(doc(db, "publicVerifications", citizenId), { status, verifiedAt, verifiedBy });
}
