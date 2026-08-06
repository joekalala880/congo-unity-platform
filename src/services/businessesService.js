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

const COLLECTION = "businesses";

function buildFieldPayload(fields) {
  return {
    ownerName: fields.ownerName || "",
    businessName: fields.businessName || "",
    category: fields.category || "",
    shortDescription: fields.shortDescription || "",
    fullDescription: fields.fullDescription || "",
    logoUrl: fields.logoUrl || "",
    coverImageUrl: fields.coverImageUrl || "",
    phone: fields.phone || "",
    email: fields.email || "",
    website: fields.website || "",
    address: fields.address || "",
    city: fields.city || "",
    provinceOrState: fields.provinceOrState || "",
    country: fields.country || "",
    postalCode: fields.postalCode || "",
    mapLink: fields.mapLink || "",
    openingHours: fields.openingHours || "",
    languages: fields.languages || "",
    services: fields.services || "",
    priceRange: fields.priceRange || "",
    socialLinks: fields.socialLinks || "",
    accessibilityInfo: fields.accessibilityInfo || "",
  };
}

export async function createBusiness(user, fields, { submitForApproval } = {}) {
  const payload = {
    ...buildFieldPayload(fields),
    ownerUserId: user.uid,
    ownerEmail: user.email,
    status: submitForApproval ? "pending_approval" : "draft",
    adminMessage: "",
    featured: false,
    averageRating: 0,
    reviewCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, COLLECTION), payload);
  return ref.id;
}

export async function updateBusinessContent(businessId, fields) {
  await updateDoc(doc(db, COLLECTION, businessId), {
    ...buildFieldPayload(fields),
    updatedAt: serverTimestamp(),
  });
}

export async function submitForApproval(businessId) {
  await updateDoc(doc(db, COLLECTION, businessId), {
    status: "pending_approval",
    updatedAt: serverTimestamp(),
  });
}

export async function closeBusiness(businessId) {
  await updateDoc(doc(db, COLLECTION, businessId), {
    status: "closed",
    updatedAt: serverTimestamp(),
  });
}

export async function getBusiness(businessId) {
  const snap = await getDoc(doc(db, COLLECTION, businessId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// No full-text search backend — approved businesses are fetched once and
// filtered/searched/sorted client-side, the same pattern used for jobs and
// events elsewhere in this app.
export async function listApprovedBusinesses() {
  const snapshot = await getDocs(query(collection(db, COLLECTION), where("status", "==", "approved")));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listMyBusinesses(uid) {
  const snapshot = await getDocs(query(collection(db, COLLECTION), where("ownerUserId", "==", uid)));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}
