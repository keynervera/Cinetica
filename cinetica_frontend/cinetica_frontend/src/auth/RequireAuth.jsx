import { Navigate } from "react-router-dom";
import { isLoggedIn } from "./auth";

export default function RequireAuth({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return children;
}
