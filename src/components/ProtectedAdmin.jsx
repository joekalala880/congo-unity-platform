import { Navigate } from "react-router-dom";
import useIsAdmin from "../hooks/useIsAdmin";
import useAccountStatus from "../hooks/useAccountStatus";

function ProtectedAdmin({ children }) {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { status, loading: statusLoading } = useAccountStatus();

  if (adminLoading || statusLoading) {
    return <p className="admin-checking">Checking permissions...</p>;
  }

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  if (status === "suspended") {
    return <Navigate to="/account-suspended" replace />;
  }

  return children;
}

export default ProtectedAdmin;
