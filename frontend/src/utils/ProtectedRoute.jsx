import { Outlet, Navigate } from "react-router";
import { useAuth } from "../context/AuthProvider";

const ProtectedRoute = () => {
  const { loading, email } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (email) {
    return <Outlet />;
  } else {
    return <Navigate to="/auth" />;
  }
};

export default ProtectedRoute;
