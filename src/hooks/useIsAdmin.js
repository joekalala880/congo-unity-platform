import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";

// Same admin check used by Navbar/ProtectedAdmin, extracted so new code
// (starting with the gallery's one-time seed action) doesn't need a
// third copy of this logic.
function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const profileQuery = query(
          collection(db, "congoleseProfiles"),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(profileQuery);
        setIsAdmin(snapshot.docs[0]?.data()?.role === "admin");
      } catch (error) {
        console.error("Failed to check admin role:", error);
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return isAdmin;
}

export default useIsAdmin;
