import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "congoGalleryItems";
const PAGE_SIZE = 24;
const SEARCH_FETCH_LIMIT = 300;
const ADMIN_FETCH_LIMIT = 1000;

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

// Admin manager list: unlike fetchGalleryPage/fetchAllForSearch, this
// deliberately does NOT filter on active — the manager needs to see (and
// toggle) inactive items too. Gated to admins by firestore.rules only
// insofar as write actions are; read is public same as everywhere else.
export async function fetchAllGalleryItemsForAdmin() {
  const snapshot = await getDocs(
    query(collection(db, COLLECTION), orderBy("createdAt", "desc"), limit(ADMIN_FETCH_LIMIT))
  );

  return snapshot.docs.map(mapDoc);
}

export async function getGalleryItemBySlug(slug) {
  const snapshot = await getDoc(doc(db, COLLECTION, slug));
  return snapshot.exists() ? mapDoc(snapshot) : null;
}

// slug doubles as the Firestore document ID (see seedInitialGalleryItems),
// so a reused slug wouldn't create a duplicate — it would silently
// overwrite the existing item on the next setDoc. Firestore rules can't
// express "this exact document must not already exist" as a create-time
// check here (the create/update split happens automatically based on
// whether a document already exists at the path, not on anything this
// function controls), so uniqueness is enforced with a preflight read
// instead. isAdmin() in firestore.rules still gates the write itself.
export async function createGalleryItem(slug, data) {
  const existing = await getDoc(doc(db, COLLECTION, slug));

  if (existing.exists()) {
    throw new Error(`A gallery item with the slug "${slug}" already exists.`);
  }

  await setDoc(doc(db, COLLECTION, slug), {
    ...data,
    slug,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// slug is treated as immutable after creation — renaming it would mean a
// different document ID, i.e. a delete + recreate, not an update. The form
// only ever calls this with the original slug.
export async function updateGalleryItem(slug, data) {
  await updateDoc(doc(db, COLLECTION, slug), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteGalleryItem(slug) {
  await deleteDoc(doc(db, COLLECTION, slug));
}
