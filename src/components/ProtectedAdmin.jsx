import { Navigate } from "react-router-dom";
import useIsAdmin from "../hooks/useIsAdmin";

function ProtectedAdmin({ children }) {
  const { isAdmin, loading } = useIsAdmin();

  if (loading) {
    return <p className="admin-checking">Checking permissions...</p>;
  }

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedAdmin;
