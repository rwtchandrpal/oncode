import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router';
import { Info, X } from 'lucide-react';
import { dismissGuestNotice, openAuthModal } from '../features/auth/authSlice';

export const GUEST_NOTICE_TEXT = "You're in guest mode. Your progress won't be saved. Sign up or log in to save your progress.";

// Shown once, right when a guest session starts. It stays until dismissed (no timer), then the
// navbar's guest badge is the persistent reminder.
const GuestNotice = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const panelRef = useRef(null);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  const dismiss = () => dispatch(dismissGuestNotice());
  const openAuth = (mode) => {
    dispatch(dismissGuestNotice());
    dispatch(openAuthModal({ mode, redirectPath: location.pathname }));
  };

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      role="status"
      aria-live="polite"
      className="fixed top-20 inset-x-4 sm:inset-x-auto sm:right-6 sm:w-96 z-50 bg-base-100 border border-warning/40 rounded-2xl shadow-2xl p-4 focus:outline-none"
    >
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-warning shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-base-content flex-1">{GUEST_NOTICE_TEXT}</p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss guest mode notice"
          className="btn btn-ghost btn-xs btn-circle text-base-content/60"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap justify-end gap-2 mt-3">
        <button type="button" onClick={dismiss} className="btn btn-ghost btn-sm">
          Got it
        </button>
        <button type="button" onClick={() => openAuth('login')} className="btn btn-outline btn-sm">
          Log in
        </button>
        <button type="button" onClick={() => openAuth('signup')} className="btn btn-primary btn-sm">
          Sign up
        </button>
      </div>
    </div>
  );
};

export default GuestNotice;
