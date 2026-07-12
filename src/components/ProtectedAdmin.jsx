import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";

function ProtectedAdmin({ children }) {
  const [status, setStatus] = useState("checking"); // checking | authorized | unauthorized

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus("unauthorized");
        return;
      }

      try {
        const profileQuery = query(
          collection(db, "congoleseProfiles"),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(profileQuery);
        const profile = snapshot.docs[0]?.data();

        setStatus(profile?.role === "admin" ? "authorized" : "unauthorized");
      } catch (error) {
        console.error("Admin verification failed:", error);
        setStatus("unauthorized");
      }
    });

    return () => unsubscribe();
  }, []);

  if (status === "checking") {
    return <p className="admin-checking">Checking permissions...</p>;
  }

  if (status === "unauthorized") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedAdmin;
