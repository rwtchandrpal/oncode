import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildPayload, TIME_LIMITS } = require('../src/services/judgeService.js');

const tests = [{ input: '1', expectedOutput: '2' }, { input: '3', expectedOutput: '6' }];

describe('Judge0 time limits per submission', () => {
  it('every test carries the language CPU and wall limits', () => {
    for (const [language, id] of [['cpp', 54], ['java', 62], ['CPP', 54]]) {
      const payload = buildPayload(language, 'code', tests);
      expect(payload).toHaveLength(2);
      for (const t of payload) {
        expect(t.language_id).toBe(id);
        expect(t.cpu_time_limit).toBe(TIME_LIMITS[language.toLowerCase()].cpu);
        expect(t.wall_time_limit).toBe(TIME_LIMITS[language.toLowerCase()].wall);
      }
    }
  });

  it('stays within Judge0 maxima and above the wall/cpu relation', () => {
    for (const { cpu, wall } of Object.values(TIME_LIMITS)) {
      expect(cpu).toBeGreaterThan(0);
      expect(cpu).toBeLessThanOrEqual(15); // MAX_CPU_TIME_LIMIT
      expect(wall).toBeGreaterThan(cpu);
      expect(wall).toBeLessThanOrEqual(20); // MAX_WALL_TIME_LIMIT
    }
  });
});
