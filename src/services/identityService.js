import { doc, runTransaction, updateDoc } from "firebase/firestore";
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

  await updateDoc(doc(db, "congoleseProfiles", profileDocId), {
    citizenId,
    memberNumber,
    registrationDate,
  });

  return { citizenId, memberNumber, registrationDate };
}

// /verify/:citizenId is built in a later phase, but the URL format is
// fixed now so it can be encoded into today's QR codes without needing
// to regenerate them later.
export function getVerificationUrl(citizenId) {
  return `${window.location.origin}/verify/${citizenId}`;
}
