import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, Link } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { checkAuth, openAuthModal, guestSessionEnded, syncAuthFromStorage } from "./features/auth/authSlice";
import { clearGuestToken } from "./utils/guestSession";
import ServerWakeBanner from "./components/ServerWakeBanner";

// Loaded on first open, so react-hook-form + zod stay out of the initial bundle
const AuthModal = lazy(() => import("./components/AuthModal"));
const GuestNotice = lazy(() => import("./components/GuestNotice"));

// Route-level code splitting
const Home = lazy(() => import("./pages/Home"));
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

// Signed-in users only. A guest is sent to sign-up instead of the login form.
export const ProtectedRoute =({ isAuthenticated, isGuest, children }) => {
  const location = useLocation();
  if (!isAuthenticated) {
    const guestState = isGuest
      ? { mode: "signup", notice: "Sign up to get a profile and keep your progress." }
      : {};
    return <Navigate to="/" state={{ openAuthModal: true, from: location.pathname, ...guestState }} replace />;
  }
  return children;
};

// Solving a problem: signed-in users and guests
export const SolveRoute =({ isAuthenticated, isGuest, children }) => {
  const location = useLocation();
  if (!isAuthenticated && !isGuest) {
    return <Navigate to="/" state={{ openAuthModal: true, from: location.pathname }} replace />;
  }
  return children;
};

const AdminRoute = ({ user, isAuthenticated, children }) => {
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ openAuthModal: true, from: location.pathname }} replace />;
  }
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return children;
};

const App = () => {
  const { user, isAuthenticated, isCheckingAuth, authModal, isGuest, guest, guestNoticeOpen } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      dispatch(checkAuth());
    }
  }, [dispatch]);

  // Keep this tab in step when another tab logs in, logs out, or starts/ends guest mode
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === null || e.key === "token" || e.key === "guestToken") dispatch(syncAuthFromStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [dispatch]);

  // End guest mode in the UI when the 4-hour session runs out, even if no request is made
  const guestExpiresAt = isGuest ? guest?.expiresAt : null;
  useEffect(() => {
    if (!guestExpiresAt) return undefined;
    const msLeft = new Date(guestExpiresAt).getTime() - Date.now();
    const timer = setTimeout(() => {
      clearGuestToken();
      dispatch(guestSessionEnded());
      dispatch(openAuthModal({ mode: "guest-expired", redirectPath: window.location.pathname }));
    }, Math.max(0, Math.min(msLeft, 2147483647)));
    return () => clearTimeout(timer);
  }, [guestExpiresAt, dispatch]);

  // The wake-up banner sits above everything, including the boot-time auth check
  if (isCheckingAuth) {
    return (
      <>
        <ServerWakeBanner />
        <PageLoader />
      </>
    );
  }

  return (
    <>
      <ServerWakeBanner />
      {authModal.isOpen && (
        <Suspense fallback={null}>
          <AuthModal />
        </Suspense>
      )}
      {guestNoticeOpen && !authModal.isOpen && (
        <Suspense fallback={null}>
          <GuestNotice />
        </Suspense>
      )}
      <Suspense fallback={<PageLoader />}>
        <Routes>

        <Route 
          path="/" 
          element={<Home />} 
        />
        <Route 
          path="/profile" 
          element={<ProtectedRoute isAuthenticated={isAuthenticated} isGuest={isGuest}><UserProfile /></ProtectedRoute>}
        />
        <Route
          path="/problems/:slug"
          element={<SolveRoute isAuthenticated={isAuthenticated} isGuest={isGuest}><ProblemWorkSpace /></SolveRoute>}
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
            <main className="flex h-screen w-full flex-col items-center justify-center text-base-content bg-base-300 px-4 text-center">
              <h1 className="text-4xl font-bold">404 - Not Found</h1>
              <p className="mt-2 text-base-content/60">The page you are looking for does not exist.</p>
              <Link to="/" className="btn btn-primary btn-sm mt-6">Back to problems</Link>
            </main>
          } 
        />
      </Routes>
    </Suspense>
    </>
  );
};

export default App;