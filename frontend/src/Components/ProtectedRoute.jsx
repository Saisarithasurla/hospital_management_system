import { Navigate } from "react-router-dom";
import AccessDenied from "../Pages/AccessDenied";
import { toast } from "react-toastify";
import { useEffect, useRef } from "react";

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("accessToken");
  const role = localStorage.getItem("userRole");
  const toastShown = useRef(false);

  useEffect(() => {
    if (token && allowedRoles && !allowedRoles.includes(role) && !toastShown.current) {
      toast.error("Access Denied: You do not have permission to access this resource.");
      toastShown.current = true;
    }
  }, [token, role, allowedRoles]);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <AccessDenied />;
  }

  return children;
}
export default ProtectedRoute;