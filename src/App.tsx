import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Dashboard } from "./pages/Dashboard";
import { Verification } from "./pages/Verification";
import { Discover } from "./pages/Discover";
import { StartupProfile } from "./pages/StartupProfile";
import { MyStartup } from "./pages/MyStartup";
import { Bids } from "./pages/Bids";
import { Portfolio } from "./pages/Portfolio";
import { AIAssistant } from "./pages/AIAssistant";
import { Messages } from "./pages/Messages";
import { Admin } from "./pages/Admin";
import { Settings } from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/verification"
            element={
              <ProtectedRoute>
                <Verification />
              </ProtectedRoute>
            }
          />

          <Route
            path="/discover"
            element={
              <ProtectedRoute allowedRoles={["investor"]}>
                <Discover />
              </ProtectedRoute>
            }
          />

          <Route
            path="/startup/:id"
            element={
              <ProtectedRoute>
                <StartupProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-startup"
            element={
              <ProtectedRoute allowedRoles={["startup"]}>
                <MyStartup />
              </ProtectedRoute>
            }
          />

          <Route
            path="/bids"
            element={
              <ProtectedRoute>
                <Bids />
              </ProtectedRoute>
            }
          />

          <Route
            path="/portfolio"
            element={
              <ProtectedRoute allowedRoles={["investor"]}>
                <Portfolio />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ai-assistant"
            element={
              <ProtectedRoute>
                <AIAssistant />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Admin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
