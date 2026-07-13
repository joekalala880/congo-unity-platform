import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "congoGalleryItems";
const PAGE_SIZE = 24;
const SEARCH_FETCH_LIMIT = 300;

function mapDoc(docSnap) {
  return { id: docSnap.id, ...docSnap.data() };
}

// Paginated browse, optionally scoped to one category, newest first.
export async function fetchGalleryPage({ category, cursor } = {}) {
  const constraints = [where("active", "==", true)];

  if (category && category !== "All") {
    constraints.push(where("category", "==", category));
  }

  constraints.push(orderBy("createdAt", "desc"));

  if (cursor) {
    constraints.push(startAfter(cursor));
  }

  constraints.push(limit(PAGE_SIZE));

  const snapshot = await getDocs(query(collection(db, COLLECTION), ...constraints));

  return {
    items: snapshot.docs.map(mapDoc),
    // Keep the raw doc snapshot (not just its data) since startAfter()
    // needs it as a cursor.
    nextCursor:
      snapshot.docs.length === PAGE_SIZE
        ? snapshot.docs[snapshot.docs.length - 1]
        : null,
  };
}

// One-time broader fetch used only while a search term is active, so
// search isn't limited to whatever page happens to be currently loaded.
export async function fetchAllForSearch() {
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTION),
      where("active", "==", true),
      orderBy("createdAt", "desc"),
      limit(SEARCH_FETCH_LIMIT)
    )
  );

  return snapshot.docs.map(mapDoc);
}

// Matches full name, stage name/aliases, category, city, province, and
// keywords — Firestore has no native full-text search, so this runs
// client-side over whatever set is currently loaded (see fetchAllForSearch).
export function matchesSearchTerm(item, query) {
  if (!query) return true;

  const haystack = [
    item.name,
    item.title,
    item.category,
    item.subcategory,
    item.city,
    item.province,
    item.country,
    ...(item.aliases || []),
    ...(item.keywords || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

// One-time seed of the original hardcoded items into Firestore. Uses a
// fixed doc ID per item (setDoc, not addDoc) keyed by slug, so re-running
// this is safe — it only overwrites, never duplicates. Gated to admins by
// firestore.rules, not by anything in this function itself.
export async function seedInitialGalleryItems(items) {
  await Promise.all(
    items.map((item) =>
      setDoc(doc(db, COLLECTION, item.slug), {
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )
  );
}
