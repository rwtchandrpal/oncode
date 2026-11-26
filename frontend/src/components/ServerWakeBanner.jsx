import { useEffect, useState } from 'react';
import { CloudOff, PartyPopper, RotateCw } from 'lucide-react';
import { useServerStatus } from '../features/serverStatus/serverStatusContext';

// Rotating lines while the free-tier backend boots. Half jokes, half honest explanation.
const WAKE_MESSAGES = [
  'Our server takes naps when nobody is around. Waking it up now 😴',
  'Free hosting perk: a 30 to 60 second cold start. Thanks for waiting!',
  'Compiling coffee… ☕',
  'Warming up the judge so your code gets a fair trial ⚖️',
  'while (!server.ready) { patience++; }',
  'Nothing is broken. The backend is just booting after some quiet time.',
  'Loading problems, test cases and a fresh pot of motivation…',
  'Still faster than a C++ template error finishing its printout.',
  'O(1) patience required. Fine, maybe O(n).',
  'Reconnecting to the database and dusting off the problem set…',
  'Good moment to crack your knuckles before the first problem 🖐️',
  'Almost there. Cold starts only happen on the first visit in a while.',
];
const MESSAGE_MS = 4000;
const PROGRESS_SECONDS = 45;

// Eases out toward ~93% over PROGRESS_SECONDS and never reaches 100% until the server answers.
const progressFor = (seconds) => 95 * (1 - Math.exp(-(seconds * 3) / PROGRESS_SECONDS));

const RotatingMessage = () => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % WAKE_MESSAGES.length), MESSAGE_MS);
    return () => clearInterval(timer);
  }, []);
  // The key restarts the CSS fade (in, hold, out) in step with the interval
  return (
    <p key={index} className="wake-message min-h-10 text-sm text-base-content/80" aria-live="off">
      {WAKE_MESSAGES[index]}
    </p>
  );
};

const ProgressBar = ({ percent, tone }) => (
  <div className="h-1 w-full bg-base-content/10" aria-hidden="true">
    <div
      className={`wake-progress h-full ${tone === 'success' ? 'bg-success' : 'wake-shimmer'}`}
      style={{ width: `${percent}%` }}
    />
  </div>
);

const Card = ({ children, tone }) => (
  <div className="pointer-events-none fixed inset-x-0 top-3 z-[1000] flex justify-center px-4">
    <section
      role="status"
      aria-live="polite"
      className={`wake-card pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border bg-base-200/95 shadow-2xl backdrop-blur ${
        tone === 'error' ? 'border-warning/40' : tone === 'success' ? 'border-success/40' : 'border-primary/30'
      }`}
    >
      {children}
    </section>
  </div>
);

const ServerWakeBanner = () => {
  const { status, elapsedSeconds, celebrating, reloading, retry, dismiss } = useServerStatus();

  if (status === 'failed') {
    return (
      <Card tone="error">
        <div className="flex items-start gap-3 p-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-warning/15 text-warning">
            <CloudOff className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-base-content">The server is taking too long</p>
            <p className="mt-1 text-sm text-base-content/70">
              It may still be starting up, or it may be down for a moment. Give it another try.
            </p>
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn btn-primary btn-sm" onClick={retry}>
                <RotateCw className="size-4" aria-hidden="true" /> Try again
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={dismiss}>Dismiss</button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (celebrating) {
    return (
      <Card tone="success">
        <ProgressBar percent={100} tone="success" />
        <div className="flex items-center gap-3 p-4">
          <div className="wake-pop grid size-11 shrink-0 place-items-center rounded-xl bg-success/15 text-success">
            <PartyPopper className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-base-content">You&apos;re all set 🎉</p>
            <p className="text-sm text-base-content/70">
              {reloading ? 'The server is back. Reloading the page…' : 'The server is awake. Happy coding!'}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (status !== 'waking') return null;

  return (
    <Card>
      <ProgressBar percent={progressFor(elapsedSeconds)} />
      <div className="flex items-start gap-3 p-4">
        <div className="wake-icon relative grid size-11 shrink-0 place-items-center rounded-xl bg-primary/15 font-mono text-sm font-bold text-primary" aria-hidden="true">
          <span className="wake-ping absolute inset-0 rounded-xl bg-primary/20" />
          <span className="relative">&lt;/&gt;</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-base-content">
            Waking up the server
            <span className="wake-dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>
          </p>
          <RotatingMessage />
          <p className="mt-1 text-xs text-base-content/50">
            {elapsedSeconds}s
            {elapsedSeconds >= PROGRESS_SECONDS
              ? ' · Taking a little longer than usual, hang tight.'
              : ' · Usually ready within a minute.'}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default ServerWakeBanner;
