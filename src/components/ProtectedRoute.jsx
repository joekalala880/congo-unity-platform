import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("checking"); // checking | authorized | unauthorized

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setStatus(user ? "authorized" : "unauthorized");
    });

    return () => unsubscribe();
  }, []);

  if (status === "checking") {
    return <p className="admin-checking">Checking your session...</p>;
  }

  if (status === "unauthorized") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
