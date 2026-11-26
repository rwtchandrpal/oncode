import { createContext, useContext } from 'react';
import { getSnapshot, retry, dismiss } from '../../utils/serverWake';

// { status: 'checking' | 'waking' | 'ready' | 'failed', elapsedSeconds, celebrating, reloading, retry, dismiss }
// 'checking' = boot ping in flight but still under the quiet threshold (no banner yet).
// celebrating = the short "You're all set" moment after a visible wait (status is 'ready').
export const ServerStatusContext = createContext({ ...getSnapshot(), retry, dismiss });

export const useServerStatus = () => useContext(ServerStatusContext);
