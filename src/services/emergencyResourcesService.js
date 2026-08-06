import {
  addDoc,
  collection,
  doc,
  deleteDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "emergencyResources";

function buildFieldPayload(fields) {
  return {
    resourceType: fields.resourceType || "",
    name: fields.name || "",
    description: fields.description || "",
    province: fields.province || "",
    territory: fields.territory || "",
    cityVillage: fields.cityVillage || "",
    address: fields.address || "",
    phone: fields.phone || "",
    email: fields.email || "",
    website: fields.website || "",
    hours: fields.hours || "",
  };
}

export async function createEmergencyResource(admin, fields) {
  const payload = {
    ...buildFieldPayload(fields),
    isActive: true,
    createdBy: admin.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COLLECTION), payload);
  return ref.id;
}

export async function updateEmergencyResource(resourceId, fields) {
  await updateDoc(doc(db, COLLECTION, resourceId), {
    ...buildFieldPayload(fields),
    updatedAt: serverTimestamp(),
  });
}

export async function setEmergencyResourceActive(resourceId, isActive) {
  await updateDoc(doc(db, COLLECTION, resourceId), { isActive, updatedAt: serverTimestamp() });
}

export async function deleteEmergencyResource(resourceId) {
  await deleteDoc(doc(db, COLLECTION, resourceId));
}

export async function listActiveEmergencyResources() {
  const snapshot = await getDocs(query(collection(db, COLLECTION), where("isActive", "==", true)));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listAllEmergencyResources() {
  const snapshot = await getDocs(collection(db, COLLECTION));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}
