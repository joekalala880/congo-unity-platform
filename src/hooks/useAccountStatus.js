import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

// Same doc-ID lookup pattern as useIsAdmin, extracting `status` instead of
// `role`. Used by ProtectedRoute/ProtectedAdmin to block suspended users.
// `signedIn` is tracked explicitly (not just `status == null`) so callers
// can tell "not signed in yet" apart from "signed in, no status set".
function useAccountStatus() {
  const [signedIn, setSignedIn] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setSignedIn(Boolean(user));

      if (!user) {
        setStatus(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const snapshot = await getDoc(doc(db, "congoleseProfiles", user.uid));
        setStatus(snapshot.data()?.status || null);
      } catch (error) {
        console.error("Failed to check account status:", error);
        setStatus(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { signedIn, status, loading };
}

export default useAccountStatus;
