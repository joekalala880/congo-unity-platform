import { Navigate } from "react-router-dom";
import useAccountStatus from "../hooks/useAccountStatus";

function ProtectedRoute({ children }) {
  const { signedIn, status, loading } = useAccountStatus();

  if (signedIn === null || loading) {
    return <p className="admin-checking">Checking your session...</p>;
  }

  if (!signedIn) {
    return <Navigate to="/login" replace />;
  }

  if (status === "suspended") {
    return <Navigate to="/account-suspended" replace />;
  }

  return children;
}

export default ProtectedRoute;
