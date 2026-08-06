import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "companies";

export async function getCompany(employerId) {
  const snap = await getDoc(doc(db, COLLECTION, employerId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveCompany(user, existing, fields) {
  const ref = doc(db, COLLECTION, user.uid);

  if (existing) {
    await updateDoc(ref, {
      name: fields.name || "",
      description: fields.description || "",
      website: fields.website || "",
      logoUrl: fields.logoUrl || "",
      industry: fields.industry || "",
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await setDoc(ref, {
    employerId: user.uid,
    name: fields.name || "",
    description: fields.description || "",
    website: fields.website || "",
    logoUrl: fields.logoUrl || "",
    industry: fields.industry || "",
    verified: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
