import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

// Shared admin check used by Navbar and ProtectedAdmin. Deliberately a
// doc-ID lookup (congoleseProfiles/{uid}), not a `where("userId","==",uid)`
// query — that's what firestore.rules' isAdmin() helper checks
// (exists()/get() on that exact path), so a field-based query here could
// disagree with what the rules actually allow: it would find a profile
// whose document ID doesn't match the caller's uid and report admin: true
// client-side, while every admin-gated write the rules gate would still be
// denied server-side, since exists() only ever resolves that fixed path.
// Returns { isAdmin, loading }. `loading` matters to callers that gate
// access (ProtectedAdmin): isAdmin defaults to false before the Firestore
// lookup resolves, so a consumer that redirects on `!isAdmin` without also
// checking `loading` would briefly bounce a real admin out on every load.
function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const snapshot = await getDoc(doc(db, "congoleseProfiles", user.uid));
        setIsAdmin(snapshot.data()?.role === "admin");
      } catch (error) {
        console.error("Failed to check admin role:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { isAdmin, loading };
}

export default useIsAdmin;
