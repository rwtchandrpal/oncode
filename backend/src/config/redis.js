const { createClient } = require('redis');

const client = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        // Keep retrying with backoff (200 ms steps, capped at 5 s) instead of giving up (BUG-02).
        reconnectStrategy: (retries) => Math.min(retries * 200, 5000),
        connectTimeout: 5000,
    },
    // While Redis is down, fail commands immediately rather than queueing them, so callers can
    // fail open instead of hanging the request (BUG-04).
    disableOfflineQueue: true,
});

// Without an 'error' listener, node-redis re-emits socket errors as an uncaught exception and
// the whole process exits (BUG-02). Log once per outage instead of on every retry.
let lastErrorLoggedAt = 0;
client.on('error', (err) => {
    const now = Date.now();
    if (now - lastErrorLoggedAt > 30000) {
        lastErrorLoggedAt = now;
        console.warn(`[redis] connection error: ${err.code || err.name || 'error'} (will keep retrying)`);
    }
});
client.on('ready', () => {
    lastErrorLoggedAt = 0;
    console.log('[redis] ready');
});

module.exports = client;
