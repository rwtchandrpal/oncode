import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router';
import { UserRound } from 'lucide-react';
import { endGuestSession, logoutUser, openAuthModal } from '../features/auth/authSlice';

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

const GlobalNavbar = () => {
  const { user, isGuest, guest } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const openAuth = (mode) => dispatch(openAuthModal({ mode, redirectPath: location.pathname }));

  const handleExitGuest = async () => {
    closeDropdown();
    await dispatch(endGuestSession());
    navigate('/', { replace: true });
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (err) {
      console.error("Logout failed: ", err);
    } finally {
      navigate('/', { replace: true });
    }
  };

  // Force the DaisyUI dropdown to close after clicking a link
  const closeDropdown = () => {
    const elem = document.activeElement;
    if (elem) {
      elem.blur();
    }
  };
      
  return (
    <nav aria-label="Main" className="navbar bg-base-100 border-b border-base-content/10 px-4 sm:px-8 top-0 sticky z-50">
      <div className="flex-1">
        <Link to="/" aria-label="Oncode home" className="text-2xl font-bold text-base-content tracking-wide">
          On<span className="text-primary">code</span>
        </Link>
      </div>
      
      <div className="flex-none">
        {user ? (
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-10 flex items-center justify-center">
                <span>{user.firstName?.charAt(0).toUpperCase() || 'U'}</span>
              </div>
            </div>
            
            <ul tabIndex={0} className="mt-3 z-1 p-2 shadow-2xl menu menu-sm dropdown-content bg-base-100 border border-base-content/10 rounded-box w-52">
              <li className="px-4 py-2 border-b border-base-content/10 text-base-content/70 text-xs cursor-default">
                Signed in as <br/> <strong className="text-base-content text-sm">{user.firstName} {user.lastName || ''}</strong>
              </li>
              
              <li className="mt-2">
                <Link to="/profile" onClick={closeDropdown} className="hover:bg-base-200 hover:text-base-content">
                  View Profile
                </Link>
              </li>
              
              {/* Admin Dashboard Link - Conditionally Rendered */}
              {user.role === 'admin' && (
                <li>
                  <Link to="/admin" onClick={closeDropdown} className="text-primary hover:bg-primary/10 hover:text-primary font-medium">
                    Admin Dashboard
                  </Link>
                </li>
              )}

              <li>
                <button onClick={handleLogout} className="text-error hover:bg-error/10 hover:text-error mt-1">
                  Logout
                </button>
              </li>
            </ul>
          </div>
        ) : isGuest ? (
          // Persistent guest reminder, with sign-up / log-in always one click away
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                aria-label="Guest mode: progress not saved. Open guest menu"
                className="badge badge-warning badge-soft gap-1 h-8 px-2 sm:px-3 cursor-pointer text-xs font-medium"
              >
                <UserRound className="w-3.5 h-3.5" aria-hidden="true" />
                Guest<span className="hidden sm:inline"> · progress not saved</span>
              </div>
              <ul tabIndex={0} className="mt-3 z-1 p-2 shadow-2xl menu menu-sm dropdown-content bg-base-100 border border-base-content/10 rounded-box w-60">
                <li className="px-4 py-2 border-b border-base-content/10 text-base-content/70 text-xs cursor-default">
                  You&apos;re in guest mode. Your progress won&apos;t be saved.
                  {guest?.expiresAt && (
                    <span className="block mt-1 text-base-content/60">Session ends at {formatTime(guest.expiresAt)}</span>
                  )}
                </li>
                <li className="mt-1">
                  <button type="button" onClick={handleExitGuest} className="text-error hover:bg-error/10 hover:text-error">
                    Exit guest mode
                  </button>
                </li>
              </ul>
            </div>
            <button type="button" onClick={() => openAuth('login')} className="btn btn-sm btn-ghost">
              Log in
            </button>
            <button type="button" onClick={() => openAuth('signup')} className="btn btn-sm btn-primary text-primary-content border-none shadow-md">
              Sign up
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => dispatch(openAuthModal({ mode: 'login', redirectPath: '/' }))}
            className="btn btn-sm btn-primary text-primary-content border-none shadow-md"
          >
            Get Started
          </button>
        )}
      </div>
    </nav>
  );
};

export default GlobalNavbar;