import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, X, Zap, UserPlus, LogIn, Sparkles, CheckCircle2 } from 'lucide-react';
import {
  loginUser,
  registerUser,
  loginDemoUser,
  closeAuthModal,
  setAuthModalMode,
  clearError
} from '../features/auth/authSlice';
import { signupSchema } from '../validations/authSchemas';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const srLabel = 'sr-only';

const AuthModal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { authModal, error, isLoading } = useSelector((state) => state.auth);
  const { isOpen, mode, redirectPath } = authModal;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Focus management (UX-02): move focus into the dialog, keep Tab inside it, and give focus back
  // to whatever opened it (e.g. "Get Started") when it closes.
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);

  // Sign-in form
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    reset: resetLoginForm,
    formState: { errors: loginErrors }
  } = useForm();

  // Sign-up form
  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    reset: resetSignupForm,
    formState: { errors: signupErrors }
  } = useForm({
    resolver: zodResolver(signupSchema)
  });

  const handleClose = useCallback(() => {
    dispatch(closeAuthModal());
    dispatch(clearError());
    resetLoginForm();
    resetSignupForm();
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [dispatch, resetLoginForm, resetSignupForm]);

  // Escape closes; Tab / Shift+Tab cycle within the dialog
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        handleClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const inside = dialogRef.current.contains(document.activeElement);
        if (e.shiftKey && (document.activeElement === first || !inside)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Remember the opener, and restore focus to it when the dialog goes away
  useEffect(() => {
    if (!isOpen) return undefined;
    const opener = document.activeElement;
    returnFocusRef.current = opener instanceof HTMLElement && opener !== document.body ? opener : null;
    return () => {
      const target = returnFocusRef.current;
      if (target && document.contains(target)) target.focus();
    };
  }, [isOpen]);

  // Autofocus the first field whenever the dialog opens or switches mode
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const firstField = dialogRef.current.querySelector('input, [data-autofocus]');
    (firstField || dialogRef.current.querySelector(FOCUSABLE))?.focus();
  }, [isOpen, mode]);

  const handleModeChange = (newMode) => {
    dispatch(setAuthModalMode(newMode));
    dispatch(clearError());
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const onLoginSubmit = async (data) => {
    try {
      await dispatch(loginUser(data)).unwrap();
      handleClose();
      if (redirectPath) {
        navigate(redirectPath);
      }
    } catch {
      // Handled by Redux error state
    }
  };

  const onSignupSubmit = async (data) => {
    const userData = { ...data };
    delete userData.confirmPassword;
    try {
      await dispatch(registerUser(userData)).unwrap();
      handleClose();
      if (redirectPath) {
        navigate(redirectPath);
      }
    } catch {
      // Handled by Redux error state
    }
  };

  const onDemoSubmit = async () => {
    try {
      await dispatch(loginDemoUser()).unwrap();
      handleClose();
      if (redirectPath) {
        navigate(redirectPath);
      }
    } catch {
      // Handled by Redux error state
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed top-16 inset-x-0 bottom-0 z-40 flex items-start justify-center p-4 sm:p-6 pt-4 sm:pt-6 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative w-full max-w-md bg-base-100 border border-base-content/10 rounded-2xl shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[calc(100vh-5.5rem)] overflow-y-auto">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close authentication modal"
          className="absolute right-4 top-4 btn btn-sm btn-circle btn-ghost text-base-content/60 hover:text-base-content focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header & Tabs */}
        <div className="text-center mb-6">
          <h2 id="auth-modal-title" className="text-2xl font-bold text-base-content">
            {mode === 'signup' && 'Create Your Account'}
            {mode === 'login' && 'Welcome Back'}
            {mode === 'demo' && 'Try Instant Demo'}
          </h2>
          <p className="text-xs sm:text-sm text-base-content/60 mt-1">
            {mode === 'signup' && 'Join Oncode to track your progress and solve problems'}
            {mode === 'login' && 'Sign in to access your saved submissions and statistics'}
            {mode === 'demo' && 'Explore the full coding platform with a temporary guest session'}
          </p>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-base-200 p-1 rounded-xl mt-5 border border-base-content/10">
            <button
              type="button"
              onClick={() => handleModeChange('signup')}
              className={`btn btn-xs sm:btn-sm border-none shadow-none font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-primary text-primary-content shadow-sm'
                  : 'bg-transparent text-base-content/70 hover:text-base-content'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 mr-1 hidden sm:inline" />
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={`btn btn-xs sm:btn-sm border-none shadow-none font-medium transition-all ${
                mode === 'login'
                  ? 'bg-primary text-primary-content shadow-sm'
                  : 'bg-transparent text-base-content/70 hover:text-base-content'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 mr-1 hidden sm:inline" />
              Log In
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('demo')}
              className={`btn btn-xs sm:btn-sm border-none shadow-none font-medium transition-all ${
                mode === 'demo'
                  ? 'bg-secondary text-secondary-content shadow-sm'
                  : 'bg-transparent text-base-content/70 hover:text-base-content'
              }`}
            >
              <Zap className="w-3.5 h-3.5 mr-1 text-warning hidden sm:inline" />
              Demo
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-error/10 border border-error/30 text-error p-3 rounded-xl text-xs sm:text-sm mb-4 text-center">
            {error}
          </div>
        )}

        {/* ================= MODE: LOG IN ================= */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
            <div>
              <label htmlFor="auth-login-email" className={srLabel}>Email address</label>
              <input
                id="auth-login-email"
                type="email"
                placeholder="Email Address"
                autoComplete="email"
                className={`input w-full bg-base-200 border ${
                  loginErrors.email ? 'border-error' : 'border-base-content/20 focus:border-primary'
                } text-base-content placeholder-base-content/50 focus:outline-none`}
                {...registerLogin('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+\.\S+$/,
                    message: 'Please enter a valid email address'
                  }
                })}
              />
              {loginErrors.email && (
                <p className="text-error text-xs mt-1 ml-1">{loginErrors.email.message}</p>
              )}
            </div>

            <div>
              <div className="relative">
                <label htmlFor="auth-login-password" className={srLabel}>Password</label>
                <input
                  id="auth-login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  autoComplete="current-password"
                  className={`input w-full bg-base-200 border pr-10 ${
                    loginErrors.password ? 'border-error' : 'border-base-content/20 focus:border-primary'
                  } text-base-content placeholder-base-content/50 focus:outline-none`}
                  {...registerLogin('password', {
                    required: 'Password is required'
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {loginErrors.password && (
                <p className="text-error text-xs mt-1 ml-1">{loginErrors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full mt-2 shadow-lg"
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="text-center text-xs text-base-content/60 pt-2">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => handleModeChange('signup')}
                className="text-primary hover:underline font-semibold"
              >
                Sign up
              </button>
              {' · '}
              <button
                type="button"
                onClick={() => handleModeChange('demo')}
                className="text-secondary hover:underline font-semibold"
              >
                Try Demo
              </button>
            </div>
          </form>
        )}

        {/* ================= MODE: SIGN UP ================= */}
        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit(onSignupSubmit)} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label htmlFor="auth-signup-first-name" className={srLabel}>First name</label>
                <input
                  id="auth-signup-first-name"
                  type="text"
                  placeholder="First Name"
                  className={`input w-full bg-base-200 border ${
                    signupErrors.firstName ? 'border-error' : 'border-base-content/20 focus:border-primary'
                  } text-base-content placeholder-base-content/50 focus:outline-none`}
                  {...registerSignup('firstName')}
                />
                {signupErrors.firstName && (
                  <p className="text-error text-xs mt-1 ml-1">{signupErrors.firstName.message}</p>
                )}
              </div>
              <div className="flex-1">
                <label htmlFor="auth-signup-last-name" className={srLabel}>Last name (optional)</label>
                <input
                  id="auth-signup-last-name"
                  type="text"
                  placeholder="Last Name (optional)"
                  className={`input w-full bg-base-200 border ${
                    signupErrors.lastName ? 'border-error' : 'border-base-content/20 focus:border-primary'
                  } text-base-content placeholder-base-content/50 focus:outline-none`}
                  {...registerSignup('lastName')}
                />
                {signupErrors.lastName && (
                  <p className="text-error text-xs mt-1 ml-1">{signupErrors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="auth-signup-email" className={srLabel}>Email address</label>
              <input
                id="auth-signup-email"
                type="email"
                placeholder="Email Address"
                autoComplete="email"
                className={`input w-full bg-base-200 border ${
                  signupErrors.email ? 'border-error' : 'border-base-content/20 focus:border-primary'
                } text-base-content placeholder-base-content/50 focus:outline-none`}
                {...registerSignup('email')}
              />
              {signupErrors.email && (
                <p className="text-error text-xs mt-1 ml-1">{signupErrors.email.message}</p>
              )}
            </div>

            <div>
              <div className="relative">
                <label htmlFor="auth-signup-password" className={srLabel}>Password</label>
                <input
                  id="auth-signup-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  autoComplete="new-password"
                  className={`input w-full bg-base-200 border pr-10 ${
                    signupErrors.password ? 'border-error' : 'border-base-content/20 focus:border-primary'
                  } text-base-content placeholder-base-content/50 focus:outline-none`}
                  {...registerSignup('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-base-content/60 mt-1 ml-1 leading-tight">
                Must be at least 8 characters with an uppercase letter, lowercase letter, number, and special character.
              </p>
              {signupErrors.password && (
                <p className="text-error text-xs mt-1 ml-1">{signupErrors.password.message}</p>
              )}
            </div>

            <div>
              <div className="relative">
                <label htmlFor="auth-signup-confirm-password" className={srLabel}>Confirm password</label>
                <input
                  id="auth-signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                  className={`input w-full bg-base-200 border pr-10 ${
                    signupErrors.confirmPassword ? 'border-error' : 'border-base-content/20 focus:border-primary'
                  } text-base-content placeholder-base-content/50 focus:outline-none`}
                  {...registerSignup('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {signupErrors.confirmPassword && (
                <p className="text-error text-xs mt-1 ml-1">{signupErrors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full mt-2 shadow-lg"
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                'Create Account'
              )}
            </button>

            <div className="text-center text-xs text-base-content/60 pt-2">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className="text-primary hover:underline font-semibold"
              >
                Log In
              </button>
              {' · '}
              <button
                type="button"
                onClick={() => handleModeChange('demo')}
                className="text-secondary hover:underline font-semibold"
              >
                Try Demo
              </button>
            </div>
          </form>
        )}

        {/* ================= MODE: TRY DEMO ================= */}
        {mode === 'demo' && (
          <div className="space-y-4">
            <div className="bg-base-200/60 border border-base-content/10 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-secondary font-semibold text-sm">
                <Sparkles className="w-4 h-4" />
                Instant Guest Experience
              </div>
              <ul className="text-xs text-base-content/75 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>Immediate access — zero email or credentials required</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>Interactive Monaco code editor with C++ & Java runtimes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>Real-time code execution evaluated via Judge0</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>Isolated 24-hour temporary session; no shared state</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={onDemoSubmit}
              disabled={isLoading}
              className="btn btn-secondary w-full shadow-lg gap-2"
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Start Instant Demo Session
                </>
              )}
            </button>

            <div className="text-center text-xs text-base-content/60 pt-2">
              Want to save your progress permanently?{' '}
              <button
                type="button"
                onClick={() => handleModeChange('signup')}
                className="text-primary hover:underline font-semibold"
              >
                Sign Up
              </button>
              {' or '}
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className="text-primary hover:underline font-semibold"
              >
                Log In
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AuthModal;
