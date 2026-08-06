import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "businessReviews";

export function reviewIdFor(businessId, uid) {
  return `${businessId}_${uid}`;
}

// The business doc stores ratingSum + reviewCount (not a pre-computed
// average) because Firestore transactions can only get() specific
// documents, not run a collection query — tracking a sum lets create/edit/
// delete each adjust it using only the one review doc + the business doc,
// both single-document reads. The average is derived at display time.
export function averageRating(business) {
  if (!business?.reviewCount) return 0;
  return business.ratingSum / business.reviewCount;
}

export async function getMyReview(businessId, uid) {
  const snap = await getDoc(doc(db, COLLECTION, reviewIdFor(businessId, uid)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function listReviewsForBusiness(businessId) {
  const snapshot = await getDocs(query(collection(db, COLLECTION), where("businessId", "==", businessId)));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}

export async function submitReview(user, business, { rating, comment }) {
  const reviewRef = doc(db, COLLECTION, reviewIdFor(business.id, user.uid));
  const businessRef = doc(db, "businesses", business.id);

  await runTransaction(db, async (tx) => {
    const existing = await tx.get(reviewRef);
    if (existing.exists()) {
      throw new Error("You've already reviewed this business.");
    }

    tx.set(reviewRef, {
      businessId: business.id,
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName || user.email,
      rating,
      comment: comment || "",
      ownerResponse: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    tx.update(businessRef, {
      ratingSum: (business.ratingSum || 0) + rating,
      reviewCount: (business.reviewCount || 0) + 1,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function editReview(business, reviewId, newRating, newComment) {
  const reviewRef = doc(db, COLLECTION, reviewId);
  const businessRef = doc(db, "businesses", business.id);

  await runTransaction(db, async (tx) => {
    const reviewSnap = await tx.get(reviewRef);
    if (!reviewSnap.exists()) throw new Error("Review not found.");

    const oldRating = reviewSnap.data().rating;
    tx.update(reviewRef, { rating: newRating, comment: newComment || "", updatedAt: serverTimestamp() });
    tx.update(businessRef, {
      ratingSum: (business.ratingSum || 0) + (newRating - oldRating),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function respondToReview(reviewId, response) {
  await updateDoc(doc(db, COLLECTION, reviewId), {
    ownerResponse: response,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteReview(business, reviewId) {
  const reviewRef = doc(db, COLLECTION, reviewId);
  const businessRef = doc(db, "businesses", business.id);

  await runTransaction(db, async (tx) => {
    const reviewSnap = await tx.get(reviewRef);
    if (!reviewSnap.exists()) return;

    const oldRating = reviewSnap.data().rating;
    tx.delete(reviewRef);
    tx.update(businessRef, {
      ratingSum: Math.max((business.ratingSum || 0) - oldRating, 0),
      reviewCount: Math.max((business.reviewCount || 0) - 1, 0),
      updatedAt: serverTimestamp(),
    });
  });
}
