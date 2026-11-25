// Starts the in-process mock Judge0 for the whole test run.
import { startMockJudge0 } from './mockJudge0.js';

export default async function setup() {
  const port = Number(process.env.TEST_JUDGE0_PORT || 2459);
  const server = await startMockJudge0(port);
  return async () => new Promise((resolve) => server.close(resolve));
}
