import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import HomeStudent from "./pages/HomeStudent";
import HomeLibrarian from "./pages/HomeLibrarian";
import Profile from "./pages/Profile";
import Setup from "./pages/Setup";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/home" replace /> : children;
}

function Home() {
  const { user } = useAuth();
  return user.role === "librarian" ? <HomeLibrarian /> : <HomeStudent />;
}

function ProfileRoute() {
  const { user } = useAuth();
  return <Profile role={user.role} />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/student/profile" element={<ProtectedRoute><ProfileRoute /></ProtectedRoute>} />
        <Route path="/librarian/profile" element={<ProtectedRoute><ProfileRoute /></ProtectedRoute>} />
        <Route path="/setup" element={<PublicRoute><Setup /></PublicRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}