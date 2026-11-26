import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { subscribe, getSnapshot, startBootCheck, retry, dismiss } from '../../utils/serverWake';
import { ServerStatusContext } from './serverStatusContext';

// Pings the API once on app load and exposes the wake-up state (see utils/serverWake.js).
const ServerStatusProvider = ({ children }) => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(() => startBootCheck(), []);

  const value = useMemo(() => ({ ...snapshot, retry, dismiss }), [snapshot]);
  return <ServerStatusContext.Provider value={value}>{children}</ServerStatusContext.Provider>;
};

export default ServerStatusProvider;
