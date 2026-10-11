import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ children }) {
  const { currentUser } = useSelector((state) => state.users);

  // 1. غير مسجّل  login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 2. ليس superadmin  الرئيسية
  if (currentUser.role !== "superadmin") {
    return <Navigate to="/" replace />;
  }

  // 3. superadmin  يسمح
  return children;
}