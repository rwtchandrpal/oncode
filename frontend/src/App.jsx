import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router"; 
import { useSelector, useDispatch } from "react-redux";
import { checkAuth } from "./features/auth/authSlice";

// Loaded on first open, so react-hook-form + zod stay out of the initial bundle (PERF-03)
const AuthModal = lazy(() => import("./components/AuthModal"));

// Route-level code splitting
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/authentication/Login"));
const Signup = lazy(() => import("./pages/authentication/Signup"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const ProblemWorkSpace = lazy(() => import("./pages/problemWorkspace/problemWorkspace"));

// Admin routes (lazy loaded chunk)
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ManageProblemsTable = lazy(() => import("./pages/admin/ManageProblems"));
const CreateProblem = lazy(() => import("./pages/admin/CreateProblem"));
const UpdateProblem = lazy(() => import("./pages/admin/UpdateProblem"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));

// Lightweight Suspense Fallback
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-base-300">
    <span className="loading loading-spinner loading-lg text-primary"></span>
  </div>
);

const ProtectedRoute = ({ isAuthenticated, children }) => {
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ openAuthModal: true, from: location.pathname }} replace />;
  }
  return children;
};

const AdminRoute = ({ user, isAuthenticated, children }) => {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return children;
};

const PublicOnlyRoute = ({ isAuthenticated, children }) => {
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

const App = () => {
  const { user, isAuthenticated, isCheckingAuth, authModal } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      dispatch(checkAuth());
    }
  }, [dispatch]);

  if (isCheckingAuth) {
    return <PageLoader />;
  }

  return (
    <>
      {authModal.isOpen && (
        <Suspense fallback={null}>
          <AuthModal />
        </Suspense>
      )}
      <Suspense fallback={<PageLoader />}>
        <Routes>
        <Route 
          path="/login" 
          element={<PublicOnlyRoute isAuthenticated={isAuthenticated}><Login /></PublicOnlyRoute>} 
        />
        <Route 
          path="/signup" 
          element={<PublicOnlyRoute isAuthenticated={isAuthenticated}><Signup /></PublicOnlyRoute>} 
        />

        <Route 
          path="/" 
          element={<Home />} 
        />
        <Route 
          path="/profile" 
          element={<ProtectedRoute isAuthenticated={isAuthenticated}><UserProfile /></ProtectedRoute>} 
        />
        <Route 
          path="/problem/:problemId"  
          element={<ProtectedRoute isAuthenticated={isAuthenticated}><ProblemWorkSpace /></ProtectedRoute>} 
        />

        <Route
          path="/admin"
          element={<AdminRoute user={user} isAuthenticated={isAuthenticated}><AdminLayout /></AdminRoute>}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="problems" element={<ManageProblemsTable />} />
          <Route path="create-problem" element={<CreateProblem />} />
          <Route path="update-problem/:problemId" element={<UpdateProblem />} />
          <Route path="users" element={<UserManagement />} />
        </Route>

        <Route 
          path="*" 
          element={
            <div className="flex h-screen w-full flex-col items-center justify-center text-base-content bg-base-300">
              <h1 className="text-4xl font-bold">404 - Not Found</h1>
              <p className="mt-2 text-base-content/60">The page you are looking for does not exist.</p>
            </div>
          } 
        />
      </Routes>
    </Suspense>
    </>
  );
};

export default App;